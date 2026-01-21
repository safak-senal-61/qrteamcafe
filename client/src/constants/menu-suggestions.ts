
export const CATEGORY_SUGGESTIONS = [
  "Sıcak İçecekler",
  "Soğuk İçecekler",
  "Kahvaltılıklar",
  "Ana Yemekler",
  "Tatlılar",
  "Atıştırmalıklar",
  "Salatalar",
  "Makarnalar",
  "Pizzalar",
  "Burgerler"
];

export const PRODUCT_SUGGESTIONS: Record<string, string[]> = {
  "Sıcak İçecekler": ["Çay", "Türk Kahvesi", "Latte", "Cappuccino", "Espresso", "Americano", "Filtre Kahve", "Sıcak Çikolata", "Sahlep", "Bitki Çayı"],
  "Soğuk İçecekler": ["Su", "Soda", "Ayran", "Limonata", "Soğuk Kahve", "Ice Latte", "Frappe", "Milkshake", "Taze Portakal Suyu", "Coca Cola", "Fanta", "Sprite", "Ice Tea"],
  "Kahvaltılıklar": ["Serpme Kahvaltı", "Kahvaltı Tabağı", "Menemen", "Sahanda Yumurta", "Omlet", "Tost", "Bazlama Tost", "Gözleme", "Su Böreği", "Sigara Böreği"],
  "Ana Yemekler": ["Izgara Köfte", "Tavuk Şiş", "Çökertme Kebabı", "Kari Soslu Tavuk", "Mantı", "Et Sote", "Tavuk Sote", "Kuru Fasulye", "Pilav"],
  "Tatlılar": ["Cheesecake", "Tiramisu", "Magnolia", "Sufle", "Waffle", "Künefe", "Baklava", "Sütlaç", "Kazandibi", "Trileçe", "Profiterol"],
  "Atıştırmalıklar": ["Patates Kızartması", "Soğan Halkası", "Nugget", "Sosis Tabağı", "Paçanga Böreği", "Sigara Böreği", "Çıtır Tavuk"],
  "Salatalar": ["Sezar Salata", "Ton Balıklı Salata", "Hellim Salata", "Çoban Salata", "Mevsim Salata", "Gavurdağı Salata"],
  "Makarnalar": ["Spaghetti Bolognese", "Penne Arrabbiata", "Fettuccine Alfredo", "Mantı", "Lazanya"],
  "Pizzalar": ["Margarita", "Karışık Pizza", "Pepperoni Pizza", "Vejetaryen Pizza", "Dört Peynirli Pizza", "Ton Balıklı Pizza"],
  "Burgerler": ["Cheeseburger", "Hamburger", "Tavuk Burger", "Mexican Burger", "Steak Burger"]
};

// Helper to find suggestions loosely based on category name
export const getProductSuggestions = (categoryName: string) => {
  if (!categoryName) return [];
  
  // Direct match
  if (PRODUCT_SUGGESTIONS[categoryName]) return PRODUCT_SUGGESTIONS[categoryName];
  
  // Partial match (e.g. "İçecekler" -> combines Hot and Cold)
  const lowerCat = categoryName.toLowerCase();
  let suggestions: string[] = [];
  
  Object.keys(PRODUCT_SUGGESTIONS).forEach(key => {
    if (key.toLowerCase().includes(lowerCat) || lowerCat.includes(key.toLowerCase())) {
      suggestions = [...suggestions, ...PRODUCT_SUGGESTIONS[key]];
    }
  });

  // Unique suggestions, limited to top 15
  return Array.from(new Set(suggestions)).slice(0, 15);
};
