import { AuthService } from './auth.service';
import { RegisterCafeDto } from './dto/register-cafe.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterCafeDto): Promise<{
        message: string;
        cafeId: string;
    }>;
    login(dto: LoginDto): Promise<{
        message: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
            cafeId: string;
        };
    } | {
        message: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
            cafeId?: undefined;
        };
    }>;
}
