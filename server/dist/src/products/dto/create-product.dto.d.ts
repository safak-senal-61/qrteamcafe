export declare class CreateProductDto {
    categoryId: string;
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    isAvailable?: boolean;
    stock?: number;
    originalPrice?: number;
    isChefRecommended?: boolean;
    requiresPreparation?: boolean;
}
