import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Colors } from '../constants/Colors';
import { CryptoApi } from '../utils/cryptoApi';
import { X, Search, Trash2 } from 'lucide-react-native';

interface AddCryptoModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (asset: { id: string; symbol: string; name: string; amount: number; averageBuyPrice: number }, isEdit?: boolean) => void;
    onDelete?: () => void;
    initialAsset?: any;
}

export default function AddCryptoModal({ visible, onClose, onSave, onDelete, initialAsset }: AddCryptoModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCoin, setSelectedCoin] = useState<any>(null);
    const [amount, setAmount] = useState('');
    const [buyPrice, setBuyPrice] = useState('');

    // Effect to pre-fill data if editing
    React.useEffect(() => {
        if (visible) {
            if (initialAsset) {
                setSelectedCoin(initialAsset);
                setAmount(initialAsset.amount.toString());
                setBuyPrice(initialAsset.averageBuyPrice.toString());
                setSearchQuery(initialAsset.name);
            } else {
                // Reset if adding new
                setSelectedCoin(null);
                setAmount('');
                setBuyPrice('');
                setSearchQuery('');
                setSearchResults([]);
            }
        }
    }, [visible, initialAsset]);

    const handleSearch = async (text: string) => {
        setSearchQuery(text);
        if (text.length > 2) {
            setLoading(true);
            const results = await CryptoApi.searchCoins(text);
            setSearchResults(results.slice(0, 5)); // Limit to 5 results
            setLoading(false);
        } else {
            setSearchResults([]);
        }
    };

    const handleSelectCoin = (coin: any) => {
        setSelectedCoin(coin);
        setSearchQuery(coin.name);
        setSearchResults([]);
    };

    const handleSave = () => {
        if (!selectedCoin || !amount || !buyPrice) return;

        onSave({
            id: selectedCoin.id,
            symbol: selectedCoin.symbol,
            name: selectedCoin.name,
            amount: parseFloat(amount),
            averageBuyPrice: parseFloat(buyPrice),
        }, !!initialAsset);

        onClose();
    };

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.centeredView}
            >
                <View style={styles.modalView}>
                    <View style={styles.header}>
                        <Text style={styles.modalTitle}>{initialAsset ? 'Edit Asset' : 'Add Asset'}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X color={Colors.text} size={24} />
                        </TouchableOpacity>
                    </View>

                    {!initialAsset && (
                        <>
                            <Text style={styles.label}>Select Coin</Text>
                            <View style={styles.inputContainer}>
                                <Search size={20} color={Colors.textTertiary} style={{ marginRight: 10 }} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Search (e.g. Bitcoin)"
                                    value={searchQuery}
                                    onChangeText={handleSearch}
                                    placeholderTextColor={Colors.textTertiary}
                                />
                            </View>
                        </>
                    )}

                    {initialAsset && (
                        <View style={{ marginBottom: 20 }}>
                            <Text style={styles.label}>Asset</Text>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors.text }}>{initialAsset.name} ({initialAsset.symbol.toUpperCase()})</Text>
                        </View>
                    )}

                    {loading && <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 10 }} />}

                    {searchResults.length > 0 && !selectedCoin && (
                        <View style={styles.resultsContainer}>
                            {searchResults.map((coin) => (
                                <TouchableOpacity
                                    key={coin.id}
                                    style={styles.resultItem}
                                    onPress={() => handleSelectCoin(coin)}
                                >
                                    <Text style={styles.resultText}>{coin.name} ({coin.symbol})</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {selectedCoin && (
                        <>
                            <Text style={styles.label}>Amount Held</Text>
                            <TextInput
                                style={styles.activeInput}
                                placeholder="0.00"
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={setAmount}
                                placeholderTextColor={Colors.textTertiary}
                            />

                            <Text style={styles.label}>Average Buy Price ($)</Text>
                            <TextInput
                                style={styles.activeInput}
                                placeholder="0.00"
                                keyboardType="numeric"
                                value={buyPrice}
                                onChangeText={setBuyPrice}
                                placeholderTextColor={Colors.textTertiary}
                            />

                            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                <Text style={styles.saveButtonText}>{initialAsset ? 'Update Portfolio' : 'Add to Portfolio'}</Text>
                            </TouchableOpacity>

                            {initialAsset && onDelete && (
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => {
                                        Alert.alert(
                                            "Delete Asset",
                                            "Are you sure you want to remove this asset?",
                                            [
                                                { text: "Cancel", style: "cancel" },
                                                {
                                                    text: "Delete",
                                                    style: "destructive",
                                                    onPress: () => {
                                                        onDelete();
                                                        onClose();
                                                    }
                                                }
                                            ]
                                        );
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                        <Trash2 size={20} color="#FF5252" style={{ marginRight: 8 }} />
                                        <Text style={styles.deleteButtonText}>Delete Asset</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        height: '80%',
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
    },
    label: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 8,
        marginTop: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    input: {
        flex: 1,
        height: 50,
        color: Colors.text,
    },
    activeInput: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        color: Colors.text,
        fontSize: 16,
    },
    resultsContainer: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        marginTop: 5,
        maxHeight: 200,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    resultItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    resultText: {
        fontSize: 16,
        color: Colors.text,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 30,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    deleteButton: {
        marginTop: 15,
        padding: 15,
        borderRadius: 12,
        backgroundColor: '#FFEBEE',
        alignItems: 'center',
    },
    deleteButtonText: {
        color: '#FF5252',
        fontSize: 16,
        fontWeight: '600',
    },
});
