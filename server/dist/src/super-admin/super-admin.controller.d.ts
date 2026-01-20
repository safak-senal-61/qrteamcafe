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
            name: string;
            id: string;
            cafeId: string;
            passwordHash: string;
            isActive: boolean;
            isApproved: boolean;
            resetCode: string | null;
            resetCodeExpires: Date | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
    } & {
        phone: string | null;
        email: string | null;
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: string | null;
        city: string | null;
        district: string | null;
        address: string | null;
        website: string | null;
        authorizedPerson: string | null;
        serviceType: string | null;
        workingHours: string | null;
        preparationTime: number | null;
        paymentMethods: string | null;
        logoUrl: string | null;
        googleMapsUrl: string | null;
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
            name: string;
            id: string;
            cafeId: string;
            passwordHash: string;
            isActive: boolean;
            isApproved: boolean;
            resetCode: string | null;
            resetCodeExpires: Date | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
    } & {
        phone: string | null;
        email: string | null;
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: string | null;
        city: string | null;
        district: string | null;
        address: string | null;
        website: string | null;
        authorizedPerson: string | null;
        serviceType: string | null;
        workingHours: string | null;
        preparationTime: number | null;
        paymentMethods: string | null;
        logoUrl: string | null;
        googleMapsUrl: string | null;
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
        email: string | null;
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: string | null;
        city: string | null;
        district: string | null;
        address: string | null;
        website: string | null;
        authorizedPerson: string | null;
        serviceType: string | null;
        workingHours: string | null;
        preparationTime: number | null;
        paymentMethods: string | null;
        logoUrl: string | null;
        googleMapsUrl: string | null;
        status: string;
    }>;
    rejectCafe(id: string): Promise<{
        phone: string | null;
        email: string | null;
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        type: string | null;
        city: string | null;
        district: string | null;
        address: string | null;
        website: string | null;
        authorizedPerson: string | null;
        serviceType: string | null;
        workingHours: string | null;
        preparationTime: number | null;
        paymentMethods: string | null;
        logoUrl: string | null;
        googleMapsUrl: string | null;
        status: string;
    }>;
}
