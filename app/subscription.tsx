import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Star, Crown, Zap, Shield, Clock } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {styles} from '../assets/styles/subscription.styles'
interface PlanFeature {
  text: string;
  included: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  period: string;
  popular?: boolean;
  premium?: boolean;
  features: PlanFeature[];
  savings?: string;
  icon: React.ComponentType<any>;
  gradient: string[];
}

const plans: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Базовый',
    price: 2990,
    period: 'месяц',
    icon: Clock,
    gradient: ['#667eea', '#764ba2'],
    features: [
      { text: '5 моек в месяц', included: true },
      { text: 'Базовая мойка кузова', included: true },
      { text: 'Поиск ближайших моек', included: true },
      { text: 'История посещений', included: true },
      { text: 'Премиум мойка', included: false },
      { text: 'Детейлинг услуги', included: false },
      { text: 'Приоритетная запись', included: false },
      { text: '24/7 поддержка', included: false }
    ]
  },
  {
    id: 'premium',
    name: 'Премиум',
    price: 4990,
    originalPrice: 7990,
    period: 'месяц',
    popular: true,
    icon: Star,
    gradient: ['#f093fb', '#f5576c'],
    savings: 'Экономия 3000₸',
    features: [
      { text: '12 моек в месяц', included: true },
      { text: 'Премиум мойка + воск', included: true },
      { text: 'Химчистка салона 2 раза', included: true },
      { text: 'Приоритетная запись', included: true },
      { text: 'Поиск ближайших моек', included: true },
      { text: 'История посещений', included: true },
      { text: 'Детейлинг услуги', included: true },
      { text: '24/7 поддержка', included: true }
    ]
  },
  {
    id: 'vip',
    name: 'VIP',
    price: 8990,
    originalPrice: 15990,
    period: 'месяц',
    premium: true,
    icon: Crown,
    gradient: ['#ffecd2', '#fcb69f'],
    savings: 'Экономия 7000₸',
    features: [
      { text: 'Безлимитные мойки', included: true },
      { text: 'Полный детейлинг', included: true },
      { text: 'Химчистка салона', included: true },
      { text: 'Полировка кузова', included: true },
      { text: 'Защитное покрытие', included: true },
      { text: 'Выездная мойка', included: true },
      { text: 'VIP поддержка 24/7', included: true },
      { text: 'Персональный менеджер', included: true }
    ]
  }
];

const testimonials = [
  {
    name: 'Асылбек М.',
    text: 'Сэкономил более 50% на мойке авто! Теперь езжу на чистой машине каждый день.',
    rating: 5
  },
  {
    name: 'Айгуль К.',
    text: 'Премиум план окупился за первый месяц. Качество услуг на высшем уровне!',
    rating: 5
  },
  {
    name: 'Данияр Т.',
    text: 'VIP подписка - это другой уровень сервиса. Машина всегда идеальна!',
    rating: 5
  }
];

export default function SubscriptionScreen() {
  const [selectedPlan, setSelectedPlan] = useState<string>('premium');
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const handleSubscribe = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    if (Platform.OS === 'web') {
      const confirmed = confirm(`Вы выбрали план "${plan.name}" за ${plan.price}₸/${plan.period}. Продолжить?`);
      if (confirmed) {
        alert('Успех! Подписка успешно оформлена! Добро пожаловать в премиум сервис.');
        router.back();
      }
    } else {
      Alert.alert(
        'Подтверждение подписки',
        `Вы выбрали план "${plan.name}" за ${plan.price}₸/${plan.period}. Продолжить?`,
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Подписаться',
            onPress: () => {
              Alert.alert('Успех!', 'Подписка успешно оформлена! Добро пожаловать в премиум сервис.');
              router.back();
            }
          }
        ]
      );
    }
  };

  const renderPlan = (plan: SubscriptionPlan) => {
    const isSelected = selectedPlan === plan.id;
    
    return (
      <TouchableOpacity
        key={plan.id}
        style={[
          styles.planCard,
          isSelected && styles.selectedPlan,
          plan.popular && styles.popularPlan
        ]}
        onPress={() => setSelectedPlan(plan.id)}
      >
        {plan.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>ПОПУЛЯРНЫЙ</Text>
          </View>
        )}
        
        {plan.premium && (
          <View style={styles.premiumBadge}>
            <Crown size={16} color="#FFD700" />
            <Text style={styles.premiumText}>VIP</Text>
          </View>
        )}

        <LinearGradient
          colors={plan.gradient as [string, string, ...string[]]}
          style={styles.planHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <plan.icon size={32} color="white" />
          <Text style={styles.planName}>{plan.name}</Text>
        </LinearGradient>

        <View style={styles.planBody}>
          <View style={styles.priceContainer}>
            {plan.originalPrice && (
              <Text style={styles.originalPrice}>{plan.originalPrice}₸</Text>
            )}
            <Text style={styles.price}>{plan.price}₸</Text>
            <Text style={styles.period}>/{plan.period}</Text>
          </View>
          
          {plan.savings && (
            <View style={styles.savingsContainer}>
              <Text style={styles.savings}>{plan.savings}</Text>
            </View>
          )}

          <View style={styles.featuresContainer}>
            {plan.features.map((feature, featureIndex) => (
              <View key={`${plan.id}-feature-${featureIndex}`} style={styles.featureRow}>
                <View style={[
                  styles.featureIcon,
                  { backgroundColor: feature.included ? '#4CAF50' : '#E0E0E0' }
                ]}>
                  <Check 
                    size={12} 
                    color={feature.included ? 'white' : '#999'} 
                  />
                </View>
                <Text style={[
                  styles.featureText,
                  !feature.included && styles.disabledFeature
                ]}>
                  {feature.text}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Премиум подписка</Text>
            <Text style={styles.headerSubtitle}>
              Экономьте до 70% на мойке авто
            </Text>
          </View>
        </LinearGradient>

        {/* Value Proposition */}
        <View style={styles.valueSection}>
          <Text style={styles.valueTitle}>🚗 Почему клиенты выбирают нас?</Text>
          
          <View style={styles.benefitsGrid}>
            <View style={styles.benefitItem}>
              <Zap size={24} color="#4CAF50" />
              <Text style={styles.benefitTitle}>Экономия времени</Text>
              <Text style={styles.benefitText}>Без очередей и ожидания</Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Shield size={24} color="#2196F3" />
              <Text style={styles.benefitTitle}>Гарантия качества</Text>
              <Text style={styles.benefitText}>100% гарантия результата</Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Star size={24} color="#FF9800" />
              <Text style={styles.benefitTitle}>Премиум сервис</Text>
              <Text style={styles.benefitText}>Лучшие мойки Алматы</Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Crown size={24} color="#9C27B0" />
              <Text style={styles.benefitTitle}>VIP обслуживание</Text>
              <Text style={styles.benefitText}>Персональный подход</Text>
            </View>
          </View>
        </View>

        {/* Urgency */}
        <View style={styles.urgencySection}>
          <Text style={styles.urgencyTitle}>🔥 Ограниченное предложение!</Text>
          <Text style={styles.urgencyText}>
            Только до конца месяца - скидка до 50% на все планы!
            Осталось мест: 47 из 100
          </Text>
        </View>

        {/* Plans */}
        <View style={styles.plansSection}>
          <Text style={styles.sectionTitle}>Выберите свой план</Text>
          {plans.map(renderPlan)}
        </View>

        {/* Social Proof */}
        <View style={styles.testimonialsSection}>
          <Text style={styles.sectionTitle}>Отзывы клиентов</Text>
          {testimonials.map((testimonial, testimonialIndex) => (
            <View key={`testimonial-${testimonialIndex}`} style={styles.testimonialCard}>
              <View style={styles.testimonialHeader}>
                <Text style={styles.testimonialName}>{testimonial.name}</Text>
                <View style={styles.rating}>
                  {[...Array(testimonial.rating)].map((_, starIndex) => (
                    <Star key={`star-${testimonialIndex}-${starIndex}`} size={16} color="#FFD700" fill="#FFD700" />
                  ))}
                </View>
              </View>
              <Text style={styles.testimonialText}>{testimonial.text}</Text>
            </View>
          ))}
        </View>

        {/* Risk Reversal */}
        <View style={styles.guaranteeSection}>
          <Shield size={32} color="#4CAF50" />
          <Text style={styles.guaranteeTitle}>Гарантия возврата денег</Text>
          <Text style={styles.guaranteeText}>
            Не довольны качеством? Вернем 100% стоимости в течение 7 дней!
          </Text>
        </View>

        {/* CTA Button */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => handleSubscribe(selectedPlan)}
          >
            <LinearGradient
              colors={['#4CAF50', '#45a049']}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>
                Подписаться сейчас - {plans.find(p => p.id === selectedPlan)?.price}₸
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <Text style={styles.ctaSubtext}>
            Отменить можно в любое время
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

