#!/bin/bash

echo "🚀 Backend Sunucu kurulumu başlıyor..."

# 1. Swap Alanı Oluşturma (4GB)
if [ ! -f /swapfile ]; then
    echo "📦 Swap alanı oluşturuluyor..."
    sudo fallocate -l 4G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    
    # Performans ayarları
    sudo sysctl vm.swappiness=10
    sudo sysctl vm.vfs_cache_pressure=50
    echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf
    echo "vm.vfs_cache_pressure=50" | sudo tee -a /etc/sysctl.conf
    echo "✅ Swap oluşturuldu."
else
    echo "ℹ️ Swap alanı zaten mevcut."
fi

# 2. Nginx Kurulumu
echo "🌐 Nginx kuruluyor..."
sudo apt update
sudo apt install nginx -y

# 3. Firewall Ayarları
echo "🛡️ Güvenlik duvarı ayarlanıyor..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
# 3001 portunu dışarıya kapatıyoruz, sadece Nginx (Localhost) üzerinden erişilecek.
sudo ufw --force enable

# 4. Servisi Başlat
sudo systemctl start nginx
sudo systemctl enable nginx

echo "✅ Kurulum tamamlandı! Şimdi Nginx konfigürasyonunu kopyalayıp SSL kurulumuna geçebilirsiniz."
