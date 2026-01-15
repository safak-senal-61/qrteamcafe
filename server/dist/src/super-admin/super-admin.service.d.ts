import { PrismaService } from '../prisma/prisma.service';
import { RegisterSuperAdminDto } from './dto/register-super-admin.dto';
import { ConfigService } from '@nestjs/config';
export declare class SuperAdminService {
    private prisma;
    private configService;
    constructor(prisma: PrismaService, configService: ConfigService);
    register(dto: RegisterSuperAdminDto): Promise<{
        message: string;
    }>;
    getPendingCafes(): Promise<({
        admins: {
            email: string;
            id: string;
            cafeId: string;
            passwordHash: string;
            name: string;
            isActive: boolean;
            isApproved: boolean;
            createdAt: Date;
            updatedAt: Date;
        }[];
    } & {
        phone: string | null;
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        status: string;
    })[]>;
    getAllCafes(): Promise<({
        admins: {
            email: string;
            id: string;
            cafeId: string;
            passwordHash: string;
            name: string;
            isActive: boolean;
            isApproved: boolean;
            createdAt: Date;
            updatedAt: Date;
        }[];
    } & {
        phone: string | null;
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        status: string;
    })[]>;
    getDashboardStats(): Promise<{
        totalCafes: number;
        pendingCafes: number;
        activeCafes: number;
        rejectedCafes: number;
        totalUsers: number;
    }>;
    getSettings(): Promise<Record<string, string>>;
    updateSetting(key: string, value: string): Promise<{
        updatedAt: Date;
        description: string | null;
        key: string;
        value: string;
    }>;
    approveCafe(cafeId: string): Promise<{
        phone: string | null;
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        status: string;
    }>;
    rejectCafe(cafeId: string): Promise<{
        phone: string | null;
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        status: string;
    }>;
}
