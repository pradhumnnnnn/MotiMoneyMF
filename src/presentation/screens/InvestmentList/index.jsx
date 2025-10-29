import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Platform,
  Image,
  BackHandler,
} from 'react-native';
import { widthToDp, heightToDp } from '../../../helpers/Responsive';
import * as Config from '../../../helpers/Config';
import SInfoSvg from '../../../presentation/svgs';
import InvestedPorfolio from '../../../hooks/investedPortfolio';
import CommonHeader from '../../../components/CommonHeader';
import { useDispatch } from 'react-redux';
import { setSipInterface } from '../../../store/slices/marketSlice';

const InvestmentList = ({ navigation }) => {
  const dispatch = useDispatch();
  const { investmentData, loading, error, refetch } = InvestedPorfolio();

  const formatCurrency = amount => {
    return `₹${parseFloat(amount ?? 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };
 useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      // Prevent default back action
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  const formatDate = dateString => {
    return dateString ? new Date(dateString).toLocaleDateString('en-IN') : '-';
  };

  const calculateGainLoss = (current, invested) => {
    const gain = parseFloat(current ?? 0) - parseFloat(invested ?? 0);
    const percentage = (gain / parseFloat(invested || 1)) * 100;
    return { gain, percentage };
  };

  // Updated to use consolidatedData
  const totalInvested =
    investmentData?.consolidatedData?.reduce(
      (sum, item) => sum + parseFloat(item?.investedAmount ?? 0),
      0,
    ) ?? 0;

  const totalCurrent =
    investmentData?.consolidatedData?.reduce(
      (sum, item) => sum + parseFloat(item?.currentMarketPrice ?? 0),
      0,
    ) ?? 0;

  const overallGainLoss = calculateGainLoss(totalCurrent, totalInvested);

  const InvestmentCard = ({ investment, idx }) => {
    if (!investment) return null;
    const gainLoss = calculateGainLoss(
      investment?.currentMarketPrice,
      investment?.investedAmount,
    );
    const isProfit = gainLoss.gain >= 0;
    return (
      <TouchableOpacity
        onPress={() => {
          dispatch(setSipInterface(investment));
          navigation?.navigate('SipInterface');
        }}
        style={{
          ...styles.card,
          borderLeftColor:
            (idx + 1) % 2 === 0
              ? Config.Colors.primary
              : Config.Colors.secondary,
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.schemeHeaderContent}>
            {investment?.amcLogoUrl && (
              <Image
                source={{ uri: investment.amcLogoUrl }}
                style={styles.amcLogo}
                resizeMode="contain"
              />
            )}
            <View style={styles.schemeInfo}>
              <Text style={styles.schemeName} numberOfLines={2}>
                {investment?.schemeName ?? '-'}
              </Text>
              <Text style={styles.amcName} numberOfLines={1}>
                {investment?.amcName ?? '-'}
              </Text>
            </View>
          </View>
          <View style={styles.sipContainer}>
            <Text style={styles.sipLabel}>SIP</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Folio No.</Text>
              <Text style={styles.value}>{investment?.folioNo ?? '-'}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Total Units</Text>
              <Text style={styles.value}>
                {parseFloat(investment?.totalUnits ?? 0).toFixed(4)}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Invested Amount</Text>
              <Text style={styles.investedAmount}>
                {formatCurrency(investment?.investedAmount)}
              </Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Current Value</Text>
              <Text style={styles.currentValue}>
                {formatCurrency(investment?.currentMarketPrice)}
              </Text>
            </View>
          </View>

          <View style={styles.navRow}>
            <View style={styles.column}>
              <Text style={styles.label}>Current NAV</Text>
              <Text style={styles.value}>
                ₹{parseFloat(investment?.currentNAV ?? 0).toFixed(2)}
              </Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Scheme Code</Text>
              <Text style={styles.value}>{investment?.schemeCode ?? '-'}</Text>
            </View>
          </View>

          <View style={styles.sipDetailsRow}>
            <View style={styles.column}>
              <Text style={styles.label}>SIP Registration No.</Text>
              <Text style={styles.value}>{investment?.SIPRegnNo ?? '-'}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>SIP Registration Date</Text>
              <Text style={styles.value}>{investment?.SIPRegnDate ?? '-'}</Text>
            </View>
          </View>

          <View style={styles.gainLossContainer}>
            <Text style={styles.label}>Gain/Loss</Text>
            <View style={styles.gainLossRow}>
              <Text
                style={[
                  styles.gainLossAmount,
                  isProfit ? styles.profit : styles.loss,
                ]}
              >
                {isProfit ? '+' : ''}
                {formatCurrency(gainLoss.gain)}
              </Text>
              <Text
                style={[
                  styles.gainLossPercent,
                  isProfit ? styles.profit : styles.loss,
                ]}
              >
                ({isProfit ? '+' : ''}
                {gainLoss.percentage.toFixed(2)}%)
              </Text>
            </View>
          </View>

          <View style={styles.dateRow}>
            <Text style={styles.dateText}>
              NAV Date: {formatDate(investment?.currentNavDate)}
            </Text>
            {investment?.installements &&
              investment.installements.length > 0 && (
                <Text style={styles.dateText}>
                  Installments: {investment.installements.length}
                </Text>
              )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.clientName}>Loading portfolio...</Text>
      </View>
    );
  }

  if (error || !investmentData?.consolidatedData) {
    return (
      <View style={styles.container}>
        <Text style={styles.clientName}>
          Unable to load data. Please try again.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {/* <CommonHeader
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      /> */}
      <Text
        style={{
          fontSize: widthToDp(6),
          fontWeight: 600,
          textAlign: 'center',
          position: 'absolute',
          top: 60,
          left: '20%',
        }}
      >
        Investment Portfolio
      </Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Portfolio Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryColumn}>
            <Text style={styles.summaryLabel}>Total Invested</Text>
            <Text style={styles.summaryInvested}>
              {formatCurrency(totalInvested)}
            </Text>
          </View>
          <View style={styles.summaryColumn}>
            <Text style={styles.summaryLabel}>Current Value</Text>
            <Text style={styles.summaryCurrent}>
              {formatCurrency(totalCurrent)}
            </Text>
          </View>
        </View>
        <View style={styles.totalGainLoss}>
          <Text style={styles.summaryLabel}>Total Gain/Loss</Text>
          <View style={styles.gainLossRow}>
            <Text
              style={[
                styles.totalGainAmount,
                overallGainLoss.gain >= 0 ? styles.profit : styles.loss,
              ]}
            >
              {overallGainLoss.gain >= 0 ? '+' : ''}
              {formatCurrency(overallGainLoss.gain)}
            </Text>
            <Text
              style={[
                styles.totalGainPercent,
                overallGainLoss.gain >= 0 ? styles.profit : styles.loss,
              ]}
            >
              ({overallGainLoss.gain >= 0 ? '+' : ''}
              {overallGainLoss.percentage.toFixed(2)}%)
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {investmentData?.consolidatedData?.map((investment, idx) => (
          <InvestmentCard
            idx={idx}
            key={
              investment?.schemeCode || investment?.SIPRegnNo || Math.random()
            }
            investment={investment}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.Colors.cyan_blue,
  },
  androidStatusBar: {
    height: StatusBar.currentHeight,
    // backgroundColor: 'black',
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: widthToDp(2),
    marginVertical: heightToDp(2),
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkIcon: {
    fontSize: widthToDp(5),
    marginRight: widthToDp(2),
    color: Config.Colors.primary,
  },
  sectionTitle: {
    fontSize: widthToDp(4.8),
    marginHorizontal: widthToDp(2),
    fontFamily: Config.fontFamilys.Poppins_SemiBold,
    color: '#2C3E50',
  },
  clientName: {
    fontSize: widthToDp(3.5),
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: heightToDp(0.5),
    opacity: 0.9,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: widthToDp(4),
    marginBottom: heightToDp(2),
    padding: widthToDp(4),
    borderRadius: widthToDp(3),
    borderWidth: 1,
    borderColor: '#1768BF',
    elevation: 2,
    shadowColor: '#1768BF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  summaryTitle: {
    fontSize: widthToDp(4.5),
    fontWeight: '600',
    color: '#1768BF',
    marginBottom: heightToDp(1.5),
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: heightToDp(1.5),
  },
  summaryColumn: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: widthToDp(3.2),
    color: '#666666',
    marginBottom: heightToDp(0.5),
  },
  summaryInvested: {
    fontSize: widthToDp(4),
    fontWeight: '600',
    color: '#1768BF',
  },
  summaryCurrent: {
    fontSize: widthToDp(4),
    fontWeight: '600',
    color: '#1768BF',
  },
  totalGainLoss: {
    alignItems: 'center',
    paddingTop: heightToDp(1),
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  totalGainAmount: {
    fontSize: widthToDp(4.5),
    fontWeight: 'bold',
  },
  totalGainPercent: {
    fontSize: widthToDp(3.5),
    fontWeight: '600',
    marginLeft: widthToDp(1),
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: widthToDp(4),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: widthToDp(3),
    marginBottom: heightToDp(2),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    borderLeftWidth: widthToDp(1),
  },
  cardHeader: {
    backgroundColor: '#F8F9FF',
    paddingHorizontal: widthToDp(4),
    paddingVertical: heightToDp(1.5),
    borderTopLeftRadius: widthToDp(3),
    borderTopRightRadius: widthToDp(3),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  schemeHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  amcLogo: {
    width: widthToDp(8),
    height: widthToDp(8),
    marginRight: widthToDp(2),
    borderRadius: widthToDp(1),
  },
  schemeInfo: {
    flex: 1,
  },
  schemeName: {
    fontSize: widthToDp(3.8),
    fontWeight: '600',
    color: '#1768BF',
    marginBottom: heightToDp(0.2),
  },
  amcName: {
    fontSize: widthToDp(3),
    color: '#666666',
    fontWeight: '400',
  },
  sipContainer: {
    backgroundColor: '#28A745',
    paddingHorizontal: widthToDp(2),
    paddingVertical: heightToDp(0.3),
    borderRadius: widthToDp(1),
  },
  sipLabel: {
    fontSize: widthToDp(2.8),
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardBody: {
    padding: widthToDp(4),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: heightToDp(1.5),
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: heightToDp(1.5),
    paddingVertical: heightToDp(0.5),
    backgroundColor: '#F8F9FF',
    paddingHorizontal: widthToDp(3),
    borderRadius: widthToDp(2),
  },
  sipDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: heightToDp(1.5),
    paddingVertical: heightToDp(0.5),
    backgroundColor: '#F0F8FF',
    paddingHorizontal: widthToDp(3),
    borderRadius: widthToDp(2),
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: widthToDp(3),
    color: '#666666',
    marginBottom: heightToDp(0.3),
  },
  value: {
    fontSize: widthToDp(3.5),
    color: '#333333',
    fontWeight: '500',
  },
  investedAmount: {
    fontSize: widthToDp(3.8),
    color: '#1768BF',
    fontWeight: '600',
  },
  currentValue: {
    fontSize: widthToDp(3.8),
    color: '#1768BF',
    fontWeight: '600',
  },
  gainLossContainer: {
    marginTop: heightToDp(1),
    paddingTop: heightToDp(1),
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  gainLossRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gainLossAmount: {
    fontSize: widthToDp(4),
    fontWeight: 'bold',
  },
  gainLossPercent: {
    fontSize: widthToDp(3.5),
    fontWeight: '600',
    marginLeft: widthToDp(1),
  },
  profit: {
    color: '#28A745',
  },
  loss: {
    color: '#DC3545',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: heightToDp(1),
    paddingTop: heightToDp(1),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  dateText: {
    fontSize: widthToDp(2.8),
    color: '#888888',
  },
});

export default InvestmentList;
