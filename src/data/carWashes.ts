export interface WorkingHours {
  is24Hours: boolean;
  start: string;
  end: string;
}

export interface BookingSlot {
  id: string;
  time: string;
  available: boolean;
  price: number;
  serviceId?: string;
}

export type BodyType = 'Седан' | 'Кроссовер' | 'Универсал' | 'Джип' | 'Внедорожник' | 'Микроавтобус';

export interface ServicePrice {
  sedan: number;
  crossover: number;
  suv: number;
  minibus: number;
}

export interface CarWashService {
  id: string;
  name: string;
  description: string;
  duration: number; // в минутах
  prices: ServicePrice;
  category: 'basic' | 'premium' | 'detailing' | 'engine' | 'interior';
  icon: string;
}

export interface CarWash {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  services: string[];
  availableServices: CarWashService[];
  workingHours: string;
  workingHoursDetailed: WorkingHours;
  phone: string;
  price: number;
  image: string;
  bookingSlots?: BookingSlot[];
  distance?: number;
  isChampion?: boolean;
  isHot?: boolean;
  availableSlots?: number;
}

// Услуги автомоек с ценами по типам кузова
export const carWashServices: CarWashService[] = [
  {
    id: 'body-wash',
    name: 'Мойка только кузова',
    description: 'Внешняя мойка кузова автомобиля',
    duration: 30,
    prices: {
      sedan: 2500,
      crossover: 3000,
      suv: 3500,
      minibus: 4000
    },
    category: 'basic',
    icon: '🚗'
  },
  {
    id: 'complex-wash',
    name: 'Комплексная мойка',
    description: 'Полная мойка кузова и салона',
    duration: 60,
    prices: {
      sedan: 3500,
      crossover: 4000,
      suv: 4500,
      minibus: 5000
    },
    category: 'basic',
    icon: '✨'
  },
  {
    id: 'pressure-wash',
    name: 'Пробивка (высок. давление)',
    description: 'Мойка под высоким давлением',
    duration: 20,
    prices: {
      sedan: 1500,
      crossover: 1800,
      suv: 2000,
      minibus: 2500
    },
    category: 'basic',
    icon: '💨'
  },
  {
    id: 'engine-wash',
    name: 'Мойка двигателя (паром)',
    description: 'Профессиональная мойка двигателя паром',
    duration: 45,
    prices: {
      sedan: 20000,
      crossover: 25000,
      suv: 30000,
      minibus: 35000
    },
    category: 'engine',
    icon: '🔧'
  },
  {
    id: 'interior-cleaning',
    name: 'Химчистка салона (полная)',
    description: 'Полная химчистка салона автомобиля',
    duration: 180,
    prices: {
      sedan: 35000,
      crossover: 40000,
      suv: 45000,
      minibus: 50000
    },
    category: 'interior',
    icon: '🧽'
  },
  {
    id: 'interior-polish',
    name: 'Полировка салона',
    description: 'Полировка пластиковых поверхностей салона',
    duration: 60,
    prices: {
      sedan: 5000,
      crossover: 6000,
      suv: 7000,
      minibus: 8000
    },
    category: 'interior',
    icon: '✨'
  },
  {
    id: 'tire-blackening',
    name: 'Чернение шин',
    description: 'Обработка шин специальным составом',
    duration: 15,
    prices: {
      sedan: 1200,
      crossover: 1200,
      suv: 1500,
      minibus: 1500
    },
    category: 'basic',
    icon: '⚫'
  },
  {
    id: 'wheel-cleaning',
    name: 'Очистка дисков (4 шт.)',
    description: 'Профессиональная очистка колесных дисков',
    duration: 30,
    prices: {
      sedan: 2000,
      crossover: 2500,
      suv: 3000,
      minibus: 3500
    },
    category: 'basic',
    icon: '🛞'
  },
  {
    id: 'gold-complex',
    name: 'Комплекс GOLD',
    description: 'Премиум комплекс услуг: мойка + воск + салон',
    duration: 90,
    prices: {
      sedan: 5500,
      crossover: 6500,
      suv: 7500,
      minibus: 8500
    },
    category: 'premium',
    icon: '🥇'
  },
  {
    id: 'platinum-complex',
    name: 'Комплекс PLATINUM',
    description: 'VIP комплекс: полная мойка + детейлинг + защита',
    duration: 150,
    prices: {
      sedan: 10500,
      crossover: 11500,
      suv: 12500,
      minibus: 13500
    },
    category: 'detailing',
    icon: '💎'
  }
];

// Функция для получения цены услуги по типу кузова
export const getServicePrice = (service: CarWashService, bodyType: string): number => {
  const normalizedBodyType = bodyType.toLowerCase();
  
  if (normalizedBodyType.includes('седан')) {
    return service.prices.sedan;
  } else if (normalizedBodyType.includes('кроссовер') || normalizedBodyType.includes('универсал')) {
    return service.prices.crossover;
  } else if (normalizedBodyType.includes('джип') || normalizedBodyType.includes('внедорожник')) {
    return service.prices.suv;
  } else if (normalizedBodyType.includes('микроавтобус')) {
    return service.prices.minibus;
  }
  
  // По умолчанию возвращаем цену для седана
  return service.prices.sedan;
};

// Функция для получения всех доступных услуг для автомойки
export const getAvailableServices = (carWashId: string): CarWashService[] => {
  // Все автомойки предоставляют все услуги
  return carWashServices;
};

export const carWashesAlmaty: CarWash[] = [
  {
    id: '1',
    name: 'WASH PREMIUM',
    address: 'пр. Аль-Фараби, 77/8',
    latitude: 43.2220,
    longitude: 76.8512,
    rating: 4.8,
    services: ['Мойка кузова', 'Химчистка салона', 'Полировка', 'Воск'],
    availableServices: getAvailableServices('1'),
    workingHours: '24/7',
    workingHoursDetailed: {
      is24Hours: true,
      start: '00:00',
      end: '23:59'
    },
    phone: '+7 (727) 123-45-67',
    price: 3000,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'
  },
  {
    id: '2',
    name: 'AUTO SPA DELUXE',
    address: 'ул. Сатпаева, 90/21',
    latitude: 43.2370,
    longitude: 76.9458,
    rating: 4.9,
    services: ['Детейлинг', 'Керамическое покрытие', 'Мойка двигателя'],
    availableServices: getAvailableServices('2'),
    workingHours: '08:00 - 22:00',
    workingHoursDetailed: {
      is24Hours: false,
      start: '08:00',
      end: '22:00'
    },
    phone: '+7 (727) 234-56-78',
    price: 5000,
    image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=400'
  },
  {
    id: '3',
    name: 'CLEAN MASTER',
    address: 'мкр. Самал-2, д. 111',
    latitude: 43.2567,
    longitude: 76.9286,
    rating: 4.6,
    services: ['Экспресс мойка', 'Мойка дисков', 'Сушка'],
    availableServices: getAvailableServices('3'),
    workingHours: '07:00 - 23:00',
    workingHoursDetailed: {
      is24Hours: false,
      start: '07:00',
      end: '23:00'
    },
    phone: '+7 (727) 345-67-89',
    price: 2500,
    image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400'
  },
  {
    id: '4',
    name: 'AQUA WASH',
    address: 'ул. Розыбакиева, 247',
    latitude: 43.2065,
    longitude: 76.6753,
    rating: 4.7,
    services: ['Бесконтактная мойка', 'Мойка подкапотного пространства'],
    availableServices: getAvailableServices('4'),
    workingHours: '06:00 - 24:00',
    workingHoursDetailed: {
      is24Hours: false,
      start: '06:00',
      end: '24:00'
    },
    phone: '+7 (727) 456-78-90',
    price: 2800,
    image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=400'
  },
  {
    id: '5',
    name: 'SHINE CAR',
    address: 'пр. Райымбека, 348',
    latitude: 43.2502,
    longitude: 76.8916,
    rating: 4.5,
    services: ['Стандартная мойка', 'Пылесос салона', 'Мойка ковриков'],
    availableServices: getAvailableServices('5'),
    workingHours: '08:00 - 20:00',
    workingHoursDetailed: {
      is24Hours: false,
      start: '08:00',
      end: '20:00'
    },
    phone: '+7 (727) 567-89-01',
    price: 2200,
    image: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400'
  },
  {
    id: '6',
    name: 'CRYSTAL WASH',
    address: 'ул. Жандосова, 140',
    latitude: 43.2890,
    longitude: 76.9234,
    rating: 4.8,
    services: ['VIP мойка', 'Антидождь', 'Чернение резины'],
    availableServices: getAvailableServices('6'),
    workingHours: '09:00 - 21:00',
    workingHoursDetailed: {
      is24Hours: false,
      start: '09:00',
      end: '21:00'
    },
    phone: '+7 (727) 678-90-12',
    price: 4200,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'
  }
];