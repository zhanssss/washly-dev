import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { MapPin, Building, ArrowRight, Clock, ChevronUp, ChevronDown } from 'lucide-react-native';
import { useAuth, CarWashDetails } from '@/contexts/AuthContext';
import {styles} from './CarWashRegistration.styles'

interface LocationPickerProps {
  onLocationSelect: (latitude: number, longitude: number, address: string) => void;
  selectedLocation?: { latitude: number; longitude: number; address: string };
}

// Генерируем список времени с промежутком 30 минут
const generateTimeOptions = () => {
  const times: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      times.push(timeString);
    }
  }
  return times;
};

const TIME_OPTIONS = generateTimeOptions();

interface TimePickerProps {
  value: string;
  onValueChange: (time: string) => void;
  label: string;
}

const TimePicker = ({ value, onValueChange, label }: TimePickerProps) => {
  const currentIndex = TIME_OPTIONS.indexOf(value);
  
  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : TIME_OPTIONS.length - 1;
    onValueChange(TIME_OPTIONS[newIndex]);
  };
  
  const handleNext = () => {
    const newIndex = currentIndex < TIME_OPTIONS.length - 1 ? currentIndex + 1 : 0;
    onValueChange(TIME_OPTIONS[newIndex]);
  };
  
  return (
    <View style={styles.timePickerContainer}>
      <Text style={styles.timePickerLabel}>{label}</Text>
      <View style={styles.timePickerControls}>
        <TouchableOpacity 
          style={styles.timePickerButton}
          onPress={handlePrevious}
        >
          <ChevronUp color="#FF6B35" size={24} />
        </TouchableOpacity>
        
        <View style={styles.timePickerDisplay}>
          <Text style={styles.timePickerValue}>{value}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.timePickerButton}
          onPress={handleNext}
        >
          <ChevronDown color="#FF6B35" size={24} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const LocationPicker = ({ onLocationSelect, selectedLocation }: LocationPickerProps) => {
  const [manualAddress, setManualAddress] = useState(selectedLocation?.address || '');

  const handleManualLocationSet = () => {
    if (!manualAddress.trim()) {
      Alert.alert('Ошибка', 'Введите адрес автомойки');
      return;
    }
    
    // Для демонстрации используем координаты центра Алматы
    // В реальном приложении здесь будет геокодирование адреса
    const latitude = 43.2220 + (Math.random() - 0.5) * 0.1;
    const longitude = 76.8512 + (Math.random() - 0.5) * 0.1;
    
    onLocationSelect(latitude, longitude, manualAddress);
  };

  return (
    <View style={styles.locationPicker}>
      <Text style={styles.label}>Адрес автомойки</Text>
      <TextInput
        style={styles.input}
        value={manualAddress}
        onChangeText={setManualAddress}
        placeholder="Введите полный адрес автомойки"
        placeholderTextColor="#666666"
        multiline
        testID="address-input"
      />
      
      <TouchableOpacity 
        style={styles.locationButton}
        onPress={handleManualLocationSet}
      >
        <MapPin color="#FF6B35" size={20} />
        <Text style={styles.locationButtonText}>УСТАНОВИТЬ МЕСТОПОЛОЖЕНИЕ</Text>
      </TouchableOpacity>
      
      {selectedLocation && (
        <View style={styles.selectedLocation}>
          <MapPin color="#00FF00" size={16} />
          <Text style={styles.selectedLocationText}>Местоположение установлено</Text>
        </View>
      )}
      
      <Text style={styles.locationHint}>
        На мобильном устройстве вы сможете выбрать точное местоположение на карте
      </Text>
    </View>
  );
};

export default function CarWashRegistration() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    latitude: 0,
    longitude: 0,
    washBays: 2,
    workingHours: {
      start: '08:00',
      end: '22:00',
      is24Hours: false
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const { completeCarWashRegistration } = useAuth();

  const formatPhone = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 11) return formData.phone;
    
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 1) return `+7 (${cleaned}`;
    if (cleaned.length <= 4) return `+7 (${cleaned.slice(1)}`;
    if (cleaned.length <= 7) return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4)}`;
    if (cleaned.length <= 9) return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhone(text);
    setFormData(prev => ({ ...prev, phone: formatted }));
  };



  const handleLocationSelect = (latitude: number, longitude: number, address: string) => {
    setFormData(prev => ({
      ...prev,
      address,
      latitude,
      longitude
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Ошибка', 'Введите название автомойки');
      return;
    }
    
    if (!formData.phone || formData.phone.length < 18) {
      Alert.alert('Ошибка', 'Введите корректный номер телефона');
      return;
    }
    
    if (!formData.address.trim() || formData.latitude === 0) {
      Alert.alert('Ошибка', 'Установите местоположение автомойки');
      return;
    }

    setIsLoading(true);
    try {
      const carWashDetails: CarWashDetails = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        phone: formData.phone,
        latitude: formData.latitude,
        longitude: formData.longitude,
        washBays: formData.washBays,
        workingHours: formData.workingHours
      };
      
      const result = await completeCarWashRegistration(carWashDetails);
      if (!result.success) {
        Alert.alert('Ошибка', result.error || 'Не удалось завершить регистрацию');
      }
    } catch {
      Alert.alert('Ошибка', 'Произошла ошибка при регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.name.trim() && 
                     formData.phone.length >= 18 && 
                     formData.address.trim() && 
                     formData.latitude !== 0;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Building color="#FF6B35" size={32} />
            </View>
            <Text style={styles.title}>РЕГИСТРАЦИЯ АВТОМОЙКИ</Text>
            <Text style={styles.description}>
              Заполните информацию о вашей автомойке
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Название автомойки</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Например: AutoWash Premium"
                placeholderTextColor="#666666"
                testID="name-input"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Телефон автомойки</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={handlePhoneChange}
                placeholder="+7 (___) ___-__-__"
                placeholderTextColor="#666666"
                keyboardType="phone-pad"
                maxLength={18}
                testID="phone-input"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Количество боксов</Text>
              <View style={styles.washBaysContainer}>
                {[1, 2, 3, 4, 5, 6].map((count) => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.washBayOption,
                      formData.washBays === count && styles.washBayOptionActive
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, washBays: count }))}
                  >
                    <Text style={[
                      styles.washBayOptionText,
                      formData.washBays === count && styles.washBayOptionTextActive
                    ]}>
                      {count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.washBaysHint}>
                Укажите количество боксов для мойки автомобилей
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Рабочее время</Text>
              <TouchableOpacity
                style={[
                  styles.workingHoursOption,
                  formData.workingHours.is24Hours && styles.workingHoursOptionActive
                ]}
                onPress={() => setFormData(prev => ({
                  ...prev,
                  workingHours: {
                    ...prev.workingHours,
                    is24Hours: !prev.workingHours.is24Hours
                  }
                }))}
              >
                <Clock color={formData.workingHours.is24Hours ? "#000000" : "#FF6B35"} size={20} />
                <Text style={[
                  styles.workingHoursOptionText,
                  formData.workingHours.is24Hours && styles.workingHoursOptionTextActive
                ]}>
                  КРУГЛОСУТОЧНО (24/7)
                </Text>
              </TouchableOpacity>
              
              {!formData.workingHours.is24Hours && (
                <View style={styles.timePickersContainer}>
                  <TimePicker
                    value={formData.workingHours.start}
                    onValueChange={(time) => {
                      setFormData(prev => ({
                        ...prev,
                        workingHours: {
                          ...prev.workingHours,
                          start: time
                        }
                      }));
                    }}
                    label="Время открытия"
                  />
                  
                  <TimePicker
                    value={formData.workingHours.end}
                    onValueChange={(time) => {
                      setFormData(prev => ({
                        ...prev,
                        workingHours: {
                          ...prev.workingHours,
                          end: time
                        }
                      }));
                    }}
                    label="Время закрытия"
                  />
                </View>
              )}
              
              <Text style={styles.workingHoursHint}>
                {formData.workingHours.is24Hours 
                  ? 'Автомойка работает круглосуточно без выходных'
                  : `Рабочие часы: ${formData.workingHours.start} - ${formData.workingHours.end}`
                }
              </Text>
            </View>

            <LocationPicker 
              onLocationSelect={handleLocationSelect}
              selectedLocation={formData.latitude !== 0 ? {
                latitude: formData.latitude,
                longitude: formData.longitude,
                address: formData.address
              } : undefined}
            />
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.button, (!isFormValid || isLoading) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!isFormValid || isLoading}
            testID="submit-button"
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'РЕГИСТРАЦИЯ...' : 'ЗАВЕРШИТЬ РЕГИСТРАЦИЮ'}
            </Text>
            <ArrowRight color="#000000" size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

