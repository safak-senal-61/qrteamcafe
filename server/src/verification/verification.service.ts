import { Injectable } from '@nestjs/common';
import { VerifyTcDto } from './dto/verify-tc.dto';

@Injectable()
export class VerificationService {
  
  async verifyTcKimlik(dto: VerifyTcDto): Promise<{ success: boolean; message: string }> {
    const { tc } = dto;

    if (this.validateTcAlgorithm(tc)) {
      return { 
        success: true, 
        message: 'TC Kimlik No geçerli.' 
      };
    } else {
      return { success: false, message: 'TC Kimlik Numarası hatalı.' };
    }
  }

  private validateTcAlgorithm(tc: string): boolean {
    if (!tc || tc.length !== 11) return false;
    if (tc[0] === '0') return false;

    const digits = tc.split('').map(d => parseInt(d, 10));
    
    // 1. 3. 5. 7. 9. hanelerin toplamı
    const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    // 2. 4. 6. 8. hanelerin toplamı
    const evenSum = digits[1] + digits[3] + digits[5] + digits[7];

    // 10. hane kontrolü: ((Tekler * 7) - Çiftler) % 10
    const digit10 = ((oddSum * 7) - evenSum) % 10;
    if (digit10 !== digits[9]) return false;

    // 11. hane kontrolü: (İlk 10 hane toplamı) % 10
    const total10 = oddSum + evenSum + digits[9];
    const digit11 = total10 % 10;

    if (digit11 !== digits[10]) return false;

    return true;
  }
}
