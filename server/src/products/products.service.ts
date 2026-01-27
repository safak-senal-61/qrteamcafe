import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { getProductImage } from './product-images.util';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(cafeId: string, createProductDto: CreateProductDto) {
    const { recommendationIds, ...rest } = createProductDto;

    const product = await this.prisma.product.create({
      data: {
        ...rest,
        cafeId,
        recommendations: recommendationIds
          ? {
              connect: recommendationIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        category: true,
      },
    });

    return {
      ...product,
      imageUrl: getProductImage(
        product.name,
        product.category?.name,
        product.imageUrl,
      ),
    };
  }

  async findAll(cafeId: string) {
    const products = await this.prisma.product.findMany({
      where: { cafeId },
      include: {
        category: true,
        recommendations: {
          select: { id: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return products.map((product) => ({
      ...product,
      imageUrl: getProductImage(
        product.name,
        product.category?.name,
        product.imageUrl,
      ),
    }));
  }

  async reorder(items: { id: string; sortOrder: number }[]) {
    // Toplu güncelleme işlemi
    return this.prisma.$transaction(
      items.map((item) =>
        this.prisma.product.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('Ürün bulunamadı');

    return {
      ...product,
      imageUrl: getProductImage(
        product.name,
        product.category?.name,
        product.imageUrl,
      ),
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    // First verify product exists
    await this.findOne(id);

    // Validate prices if either price or originalPrice is being updated
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Ürün bulunamadı');

    const newPrice =
      updateProductDto.price !== undefined
        ? updateProductDto.price
        : product.price;
    const newOriginalPrice =
      updateProductDto.originalPrice !== undefined
        ? updateProductDto.originalPrice
        : product.originalPrice;

    if (newOriginalPrice !== null && newOriginalPrice !== undefined) {
      if (newOriginalPrice < newPrice) {
        throw new BadRequestException(
          'İndirimsiz fiyat, satış fiyatından küçük olamaz.',
        );
      }
    }

    const { recommendationIds, ...rest } = updateProductDto;

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        ...rest,
        recommendations: recommendationIds
          ? {
              set: recommendationIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: { category: true },
    });

    return {
      ...updatedProduct,
      imageUrl: getProductImage(
        updatedProduct.name,
        updatedProduct.category?.name,
        updatedProduct.imageUrl,
      ),
    };
  }

  async updateStock(id: string, quantity: number) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: {
        stock: {
          increment: quantity,
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.delete({
      where: { id },
    });
  }

  async getRecommendations(productId: string, limit = 3) {
    // 1. Get manually recommended products
    const productWithRecommendations = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        recommendations: {
          where: { isAvailable: true },
          include: { category: true },
          take: limit,
        },
      },
    });

    let manualRecommendations = productWithRecommendations?.recommendations || [];
    
    // Add imageUrl to manual recommendations
    manualRecommendations = manualRecommendations.map((product) => ({
      ...product,
      imageUrl: getProductImage(
        product.name,
        product.category?.name,
        product.imageUrl,
      ),
    }));

    return manualRecommendations;
  }

  async toggleChefRecommendation(id: string, isChefRecommended: boolean) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { isChefRecommended },
    });
  }
}
