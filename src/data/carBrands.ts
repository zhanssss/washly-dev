// src/data/carBrands.ts

export interface CarModel {
    name: string;
    /** Текстовое имя кузова, согласованное с вашим справочником (например: "Седан", "Кроссовер", "Внедорожник", "Хэтчбек", "Универсал", "Пикап", "Минивэн", "Купе/Кабриолет", "Фургон", "Лифтбек") */
    bodyType: string;
}

export interface CarBrand {
    name: string;
    models: CarModel[];
}

// -----------------------------
// ВНУТРЕННЕЕ: исходный список (как у вас был) — только строки моделей
// -----------------------------
type SourceBrand = { name: string; models: string[] };

const CAR_BRANDS_SOURCE: SourceBrand[] = [
    {
        name: 'Toyota',
        models: ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Prius', 'Land Cruiser', 'Prado', 'Hilux', 'Yaris', 'Avensis', 'Auris', 'C-HR', 'Fortuner']
    },
    {
        name: 'BMW',
        models: ['3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X6', 'X7', 'Z4', 'i3', 'i8', '1 Series', '2 Series', '4 Series', '6 Series', '8 Series']
    },
    {
        name: 'Mercedes-Benz',
        models: ['A-Class', 'B-Class', 'C-Class', 'E-Class', 'S-Class', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'G-Class', 'CLA', 'CLS', 'SL', 'AMG GT']
    },
    {
        name: 'Audi',
        models: ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'TT', 'R8', 'e-tron']
    },
    {
        name: 'Volkswagen',
        models: ['Golf', 'Passat', 'Polo', 'Jetta', 'Tiguan', 'Touareg', 'Touran', 'Sharan', 'Arteon', 'T-Cross', 'T-Roc', 'Atlas']
    },
    {
        name: 'Ford',
        models: ['Focus', 'Fiesta', 'Mondeo', 'Kuga', 'EcoSport', 'Explorer', 'Mustang', 'F-150', 'Ranger', 'Transit', 'Edge', 'Escape']
    },
    {
        name: 'Hyundai',
        models: ['Solaris', 'Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Creta', 'i10', 'i20', 'i30', 'Kona', 'Palisade', 'Venue']
    },
    {
        name: 'Kia',
        models: ['Rio', 'Cerato', 'Optima', 'Sportage', 'Sorento', 'Picanto', 'Stinger', 'Soul', 'Niro', 'Seltos', 'Telluride', 'Carnival']
    },
    {
        name: 'Nissan',
        models: ['Almera', 'Sentra', 'Altima', 'Qashqai', 'X-Trail', 'Pathfinder', 'Juke', 'Murano', 'Patrol', 'Navara', 'Micra', '370Z']
    },
    {
        name: 'Honda',
        models: ['Civic', 'Accord', 'CR-V', 'HR-V', 'Pilot', 'Fit', 'Insight', 'Passport', 'Ridgeline', 'Odyssey', 'City', 'Jazz']
    },
    {
        name: 'Mazda',
        models: ['Mazda3', 'Mazda6', 'CX-3', 'CX-5', 'CX-9', 'MX-5', 'CX-30', 'Mazda2', 'BT-50', 'CX-8']
    },
    {
        name: 'Subaru',
        models: ['Impreza', 'Legacy', 'Outback', 'Forester', 'XV', 'WRX', 'BRZ', 'Ascent', 'Tribeca']
    },
    {
        name: 'Mitsubishi',
        models: ['Lancer', 'ASX', 'Outlander', 'Pajero', 'L200', 'Eclipse Cross', 'Mirage', 'Montero', 'Galant']
    },
    {
        name: 'Lexus',
        models: ['IS', 'ES', 'GS', 'LS', 'NX', 'RX', 'GX', 'LX', 'UX', 'LC', 'RC', 'CT']
    },
    {
        name: 'Infiniti',
        models: ['Q50', 'Q60', 'Q70', 'QX50', 'QX60', 'QX70', 'QX80', 'G37', 'FX']
    },
    {
        name: 'Acura',
        models: ['ILX', 'TLX', 'RLX', 'RDX', 'MDX', 'NSX', 'TSX', 'RSX']
    },
    {
        name: 'Volvo',
        models: ['S60', 'S90', 'V60', 'V90', 'XC40', 'XC60', 'XC90', 'C30', 'C70', 'S40', 'V40', 'V70']
    },
    {
        name: 'Peugeot',
        models: ['208', '308', '508', '2008', '3008', '5008', '206', '207', '307', '407', 'Partner', 'Boxer']
    },
    {
        name: 'Renault',
        models: ['Logan', 'Sandero', 'Duster', 'Kaptur', 'Arkana', 'Megane', 'Fluence', 'Koleos', 'Scenic', 'Clio', 'Talisman']
    },
    {
        name: 'Skoda',
        models: ['Octavia', 'Superb', 'Rapid', 'Fabia', 'Kodiaq', 'Karoq', 'Kamiq', 'Scala', 'Citigo', 'Yeti']
    },
    {
        name: 'Lada',
        models: ['Granta', 'Kalina', 'Priora', 'Vesta', 'XRAY', 'Largus', '4x4 (Niva)', 'Samara', '2110', '2112', '2114', '2115']
    },
    {
        name: 'УАЗ',
        models: ['Patriot', 'Hunter', 'Pickup', 'Буханка', '3151', '3153', '3159', '3162', 'Профи']
    },
    {
        name: 'ГАЗ',
        models: ['Волга', 'Соболь', 'ГАЗель', 'ГАЗон', '3110', '31105', '3102', '2410', 'Next']
    },
    {
        name: 'Chevrolet',
        models: ['Cruze', 'Malibu', 'Equinox', 'Tahoe', 'Suburban', 'Silverado', 'Camaro', 'Corvette', 'Spark', 'Aveo', 'Lacetti']
    },
    {
        name: 'Opel',
        models: ['Astra', 'Corsa', 'Insignia', 'Mokka', 'Crossland', 'Grandland', 'Zafira', 'Vectra', 'Omega']
    },
    {
        name: 'Jeep',
        models: ['Wrangler', 'Grand Cherokee', 'Cherokee', 'Compass', 'Renegade', 'Gladiator', 'Commander', 'Liberty']
    },
    {
        name: 'Land Rover',
        models: ['Range Rover', 'Range Rover Sport', 'Range Rover Evoque', 'Discovery', 'Discovery Sport', 'Defender', 'Freelander']
    },
    {
        name: 'Porsche',
        models: ['911', 'Cayenne', 'Macan', 'Panamera', 'Taycan', 'Boxster', 'Cayman', '718']
    },
    {
        name: 'Jaguar',
        models: ['XE', 'XF', 'XJ', 'F-Pace', 'E-Pace', 'I-Pace', 'F-Type', 'S-Type', 'X-Type']
    },
    {
        name: 'Другое',
        models: ['Другая модель']
    }
];

// -----------------------------
// ВНУТРЕННЕЕ: грубая эвристика для определения кузова по названию модели
// -----------------------------
function inferBodyType(brand: string, model: string): string {
    const m = model.toLowerCase();

    // Пикапы
    if (/(^|\s)(hilux|f-?150|ranger|silverado|bt-50|navara|pickup|gladiator)\b/.test(m)) return 'Пикап';

    // Фургоны/коммерческие
    if (/(transit|partner|boxer|gazelle|гaзель|соболь|буханка|профи|next)/i.test(m)) return 'Фургон';

    // Купе/кабриолет/спорт
    if (/(mustang|camaro|corvette|370z|z4|i8|tt|r8|f-type|amg gt|sl|boxster|cayman|mx-5)/i.test(m)) return 'Купе/Кабриолет';

    // Внедорожники «жёсткие»
    if (/(g-class|land cruiser|prado|fortuner|patrol|wrangler|defender|pajero)/i.test(m)) return 'Внедорожник';

    // Кроссоверы/паркетники/бОльшая часть SUV
    if (/(rav4|highlander|c-hr|nx|rx|ux|q\d|x\d|gla|glb|glc|gle|gls|x-trail|qashqai|juke|murano|pathfinder|cr-v|hr-v|pilot|cx[-\s]?\d+|kodiaq|karoq|kamiq|tiguan|touareg|t-roc|t-cross|atlas|sportage|sorento|tucson|santa fe|creta|kuga|ecosport|edge|escape|grand cherokee|cherokee|compass|renegade|macan|cayenne|panamera|discovery|discovery sport|e-pace|f-pace|i-pace|telluride|palisade|konna|kona|niro|seltos)/i.test(m)) {
        return 'Кроссовер';
    }

    // Хэтчбеки
    if (/(golf|polo|yaris|micra|rio|picanto|fiesta|a1|i10|i20|i30|auris|spark|fabia|corsa|c30|v40|city|jazz|fit)/i.test(m)) return 'Хэтчбек';

    // Универсалы
    if (/(v\d0\b|v\d\b|touring|avant|estate|wagon|универсал|outback|passat variant|superb combi)/i.test(m)) return 'Универсал';

    // Минивэны/MPV
    if (/(touran|sharan|odyssey|carnival|b-class|scenic|alhambra|zafira|freed|s-max|grand)/i.test(m)) return 'Минивэн';

    // Лифтбеки/фастбеки (опционально)
    if (/(octavia|rapid|arteon|a5 sportback|talisman|avensis liftback)/i.test(m)) return 'Лифтбек';

    // по умолчанию — седан
    return 'Седан';
}

// -----------------------------
// Итоговый список с кузовами
// -----------------------------
export const CAR_BRANDS: CarBrand[] = CAR_BRANDS_SOURCE.map(b => ({
    name: b.name,
    models: b.models.map(model => ({
        name: model,
        bodyType: inferBodyType(b.name, model),
    })),
}));

// -----------------------------
// Утилиты (обновлённые, с фильтрами по кузову)
// -----------------------------
export const getAllBrandNames = (): string[] => CAR_BRANDS.map(b => b.name);

/** Вернёт имена моделей; если задан bodyFilter — только модели указанного кузова */
export const getModelsByBrand = (brandName: string, bodyFilter?: string): string[] => {
    const brand = CAR_BRANDS.find(b => b.name === brandName);
    if (!brand) return [];
    const filter = (s: string) => s.trim().toLowerCase();
    const withBody = bodyFilter
        ? brand.models.filter(m => filter(m.bodyType) === filter(bodyFilter))
        : brand.models;
    return withBody.map(m => m.name);
};

export const searchBrands = (query: string): string[] => {
    const q = query.trim().toLowerCase();
    if (!q) return getAllBrandNames();
    return getAllBrandNames().filter(brand => brand.toLowerCase().includes(q));
};

/** Поиск по моделям бренда с опциональным фильтром кузова */
export const searchModels = (brandName: string, query: string, bodyFilter?: string): string[] => {
    const models = getModelsByBrand(brandName, bodyFilter);
    const q = query.trim().toLowerCase();
    if (!q) return models;
    return models.filter(model => model.toLowerCase().includes(q));
};

/** (опц.) Доступные кузова у бренда */
export const getBodiesByBrand = (brandName: string): string[] => {
    const b = CAR_BRANDS.find(x => x.name === brandName);
    if (!b) return [];
    const uniq = Array.from(new Set(b.models.map(m => m.bodyType)));
    return uniq;
};
