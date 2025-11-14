// components/SelectList.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';
import { styles as dashStyles } from '@/components/Dashboards/CarWashDashboard/CarWashDashboard.styles';

type BaseItem = { id: number | string; name: string };

type SelectListProps<T extends BaseItem> = {
    items: T[];
    selectedId: T['id'] | null;
    onSelect: (id: T['id']) => void;
    placeholder?: string;
    safeTop?: number;
    safeBottom?: number;
    triggerStyle?: any;
    textStyle?: any;
};

export default function SelectList<T extends BaseItem>({
                                                           items,
                                                           selectedId,
                                                           onSelect,
                                                           placeholder = 'Выбрать...',
                                                           safeTop = 0,
                                                           safeBottom = 0,
                                                           triggerStyle,
                                                           textStyle,
                                                       }: SelectListProps<T>) {
    const [open, setOpen] = React.useState(false);
    const selected = items.find(i => i.id === selectedId);

    return (
        <View>
            <TouchableOpacity
                onPress={() => setOpen(true)}
                style={[dashStyles.selectTrigger, triggerStyle]}
            >
                <Text style={[dashStyles.selectText, textStyle]}>
                    {selected ? selected.name : placeholder}
                </Text>
                <ChevronDown color="#14213D" size={18} />
            </TouchableOpacity>

            <Modal
                visible={open}
                animationType="slide"
                statusBarTranslucent
                presentationStyle="fullScreen"
                onRequestClose={() => setOpen(false)}
            >
                <View style={[dashStyles.modalContainer, { paddingTop: Math.max(safeTop, 12) }]}>
                    <View style={dashStyles.mapHeader}>
                        <Text style={dashStyles.mapHeaderTitle}>Выберите из списка</Text>
                        <TouchableOpacity
                            onPress={() => setOpen(false)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <X color="#14213D" size={22} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        contentContainerStyle={[
                            dashStyles.listContent,
                            { paddingBottom: safeBottom + 8 },
                        ]}
                    >
                        {items.map(it => (
                            <TouchableOpacity
                                key={String(it.id)}
                                onPress={() => {
                                    onSelect(it.id);
                                    setOpen(false);
                                }}
                                style={[
                                    dashStyles.listItem,
                                    selectedId === it.id && dashStyles.listItemActive,
                                ]}
                            >
                                <Text style={dashStyles.listItemText}>{it.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}
