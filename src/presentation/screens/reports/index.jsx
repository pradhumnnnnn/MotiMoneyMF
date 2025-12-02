import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import RNFS from 'react-native-fs';
import axios from 'axios';
import { Buffer } from 'buffer';
import { widthToDp, heightToDp } from '../../../helpers/Responsive';
import { getData } from '../../../helpers/localStorage';
import FileViewer from 'react-native-file-viewer';
import SInfoSvg from '../../svgs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Config from '../../../helpers/Config';
import { SafeAreaView } from 'react-native-safe-area-context';

const ReportsScreen = ({ navigation }) => {
  const [loadingItems, setLoadingItems] = React.useState({});
   const [clientCode, setClientCode] = useState('');
   useEffect(() => {
    const fetchClientCode = async () => {
      try {
        const storedValue = await AsyncStorage.getItem('clientCode');
        const clientCode = storedValue;
        setClientCode(clientCode);
      } catch (error) {
        console.error("Error retrieving clientCode:", error);
      }
    };

    fetchClientCode();
  }, []);
  const getFinancialYearRange = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  // FY flips in April
  if (month >= 4) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

const fyRange = getFinancialYearRange();

const reportItems = [
  {
    id: 1,
    name: 'Capital Gain/Loss Report',
    endPoint: `/api/v1/mf/capital-gain/${clientCode}/pdf?fy=${fyRange}`,
    fileName: 'Capital_Gain_Report.pdf'
  },
  {
    id: 2,
    name: 'Transaction Report',
    endPoint: `/api/v1/reports/transaction-statement/${clientCode}/pdf`,
    fileName: 'Transaction_Report.pdf'
  },
];

  const handleReportPress = async (reportItem) => {
  try {
    const clientCode = await getData('token');

    setLoadingItems(prev => ({ ...prev, [reportItem.id]: true }));

    const response = await axios.get(
      `https://onekyc.finovo.tech:8017${reportItem?.endPoint}`,
      {
        responseType: 'arraybuffer',
        headers: {
          Accept: 'application/pdf',
        },
        validateStatus: () => true, // ❗ allow axios to handle non-200 responses manually
      }
    );

    // Handle non-200 responses gracefully
    if (response.status !== 200) {
      try {
        const errorText = Buffer.from(response.data).toString();
        const parsedError = JSON.parse(errorText);

        Alert.alert(
          parsedError?.status || "Failed",
          parsedError?.message || "Something went wrong."
        );
      } catch (err) {
        Alert.alert(
          "Download Failed",
          `Server returned ${response.status} but no readable message.`
        );
      }

      return; // ⛔ stop further PDF handling
    }

    // ---- If successful, handle PDF ----
    const base64Data = Buffer.from(response.data).toString('base64');
    const fileName = `HoldingsReport_${Date.now()}.pdf`;
    const filePath = Platform.OS === 'android'
      ? `${RNFS.DownloadDirectoryPath}/${fileName}`
      : `${RNFS.DocumentDirectoryPath}/${fileName}`;

    await RNFS.writeFile(filePath, base64Data, 'base64');

    Alert.alert('Download Complete', `PDF saved to:\n${filePath}`);
    console.log('PDF saved to:', filePath);

    try {
      await FileViewer.open(filePath);
    } catch (err) {
      console.warn('File open error:', err);
    }

  } catch (error) {
    console.error('Error downloading PDF:', error);
    Alert.alert('Download Failed', 'An error occurred while downloading the PDF.');
  } finally {
    setLoadingItems(prev => {
      const newState = { ...prev };
      delete newState[reportItem.id];
      return newState;
    });
  }
};

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <SInfoSvg.BackButton />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reports</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Mutual Funds</Text>
        {reportItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.reportItem}
            onPress={() => handleReportPress(item)}
            activeOpacity={0.5}
            disabled={loadingItems[item.id]}
          >
            <Text style={styles.reportItemText}>{item.name}</Text>
            {loadingItems[item.id] ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <View style={styles.arrowIcon}>
                <Text style={styles.arrowText}>›</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  androidStatusBar: {
    height: StatusBar.currentHeight,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: widthToDp(4),
    paddingVertical: heightToDp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backButton: {
    padding: widthToDp(2),
    marginRight: widthToDp(2),
  },
  headerTitle: {
    fontSize: widthToDp(4.5),
    fontWeight: '600',
    color: '#333333',
    marginLeft: widthToDp(1),
  },
  content: {
    flex: 1,
    paddingHorizontal: widthToDp(4),
  },
  sectionTitle: {
    fontSize: widthToDp(4),
    fontWeight: '600',
    color: '#333333',
    marginTop: heightToDp(3),
    marginBottom: heightToDp(2),
    paddingHorizontal: widthToDp(1),
  },
  reportItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: widthToDp(4),
    paddingVertical: heightToDp(2.2),
    marginBottom: heightToDp(0.5),
    borderRadius: widthToDp(2),
    borderWidth: 1,
    borderColor: '#f1f3f4',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 1,
  },
  reportItemText: {
    fontSize: widthToDp(3.8),
    color: '#444444',
    fontWeight: '400',
    flex: 1,
  },
  arrowIcon: {
    width: widthToDp(6),
    height: widthToDp(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: widthToDp(5),
    color: '#999999',
    fontWeight: '300',
  },
});

export default ReportsScreen;