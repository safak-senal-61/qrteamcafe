import { SuperAdminService } from './super-admin.service';
import { RegisterSuperAdminDto } from './dto/register-super-admin.dto';
export declare class SuperAdminController {
    private readonly superAdminService;
    constructor(superAdminService: SuperAdminService);
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
    getStats(): Promise<{
        totalCafes: number;
        pendingCafes: number;
        activeCafes: number;
        rejectedCafes: number;
        totalUsers: number;
    }>;
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
    getSettings(): Promise<Record<string, string>>;
    updateSetting(body: {
        key: string;
        value: string;
    }): Promise<{
        updatedAt: Date;
        description: string | null;
        key: string;
        value: string;
    }>;
    approveCafe(id: string): Promise<{
        phone: string | null;
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        status: string;
    }>;
    rejectCafe(id: string): Promise<{
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
