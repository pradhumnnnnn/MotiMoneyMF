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
import Loader from '../../../components/handAnimation';

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
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  const calculateGainLoss = (current, invested) => {
    const gain = parseFloat(current ?? 0) - parseFloat(invested ?? 0);
    const percentage = (gain / parseFloat(invested || 1)) * 100;
    return { gain, percentage };
  };

  // Extract data from new structure
  const sipSummary = investmentData?.sipSummary;
  const schemes = sipSummary?.schemes || {};
  const totals = sipSummary?.totals || {};
  
  // Convert schemes object to array for mapping
  const schemeArray = Object.values(schemes);
  
  // Get SIP counts
  const activeSIPs = sipSummary?.activeSIPs || 0;
  const cancelledSIPs = sipSummary?.cancelledSIPs || 0;
  const pausedSIPs = sipSummary?.pausedSIPs || 0;
  const pendingSIPs = sipSummary?.pendingSIPs || 0;
  const totalSIPs = sipSummary?.totalSIPs || 0;

  const SchemeCard = ({ scheme, idx }) => {
    if (!scheme) return null;
    
    const isActive = scheme.active > 0;
    const isCancelled = scheme.cancelled > 0;

    return (
      <TouchableOpacity
        onPress={() => {
          dispatch(setSipInterface(scheme));
          navigation?.navigate('SipInterface');
        }}
        style={{
          ...styles.card,
          borderLeftColor: isActive ? Config.Colors.primary : Config.Colors.secondary,
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.schemeHeaderContent}>
            <View style={styles.schemeInfo}>
              <Text style={styles.schemeName} numberOfLines={2}>
                {scheme?.schemeName ?? '-'}
              </Text>
              <Text style={styles.schemeCode} numberOfLines={1}>
                {scheme?.schemeCode ?? '-'}
              </Text>
            </View>
          </View>
          <View style={[
            styles.statusContainer,
            isActive ? styles.activeStatus : styles.cancelledStatus
          ]}>
            <Text style={styles.statusText}>
              {isActive ? 'ACTIVE' : 'CANCELLED'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>ISIN</Text>
              <Text style={styles.value}>{scheme?.ISIN ?? '-'}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Total SIPs</Text>
              <Text style={styles.value}>{scheme?.totalSIPs ?? 0}</Text>
            </View>
          </View>

          <View style={styles.sipStatsRow}>
            <View style={styles.sipStat}>
              <Text style={styles.sipStatLabel}>Active</Text>
              <Text style={[styles.sipStatValue, styles.activeCount]}>
                {scheme?.active ?? 0}
              </Text>
            </View>
            <View style={styles.sipStat}>
              <Text style={styles.sipStatLabel}>Cancelled</Text>
              <Text style={[styles.sipStatValue, styles.cancelledCount]}>
                {scheme?.cancelled ?? 0}
              </Text>
            </View>
            <View style={styles.sipStat}>
              <Text style={styles.sipStatLabel}>Paused</Text>
              <Text style={styles.sipStatValue}>
                {scheme?.paused ?? 0}
              </Text>
            </View>
            <View style={styles.sipStat}>
              <Text style={styles.sipStatLabel}>Pending</Text>
              <Text style={styles.sipStatValue}>
                {scheme?.pending ?? 0}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const SipSummaryCard = () => {
    const overallGainLoss = calculateGainLoss(
      totals?.totalCurrentValue || 0,
      totals?.totalInvested || 0
    );

    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>SIP Portfolio Summary</Text>
        
        {/* SIP Counts */}
        <View style={styles.sipCountsContainer}>
          <View style={styles.sipCountRow}>
            <View style={styles.sipCountItem}>
              <Text style={styles.sipCountLabel}>Total SIPs</Text>
              <Text style={styles.sipCountValue}>{totalSIPs}</Text>
            </View>
            <View style={styles.sipCountItem}>
              <Text style={styles.sipCountLabel}>Active</Text>
              <Text style={[styles.sipCountValue, styles.activeCount]}>{activeSIPs}</Text>
            </View>
            <View style={styles.sipCountItem}>
              <Text style={styles.sipCountLabel}>Cancelled</Text>
              <Text style={[styles.sipCountValue, styles.cancelledCount]}>{cancelledSIPs}</Text>
            </View>
             <View style={styles.sipCountItem}>
              <Text style={styles.sipCountLabel}>Paused</Text>
              <Text style={styles.sipCountValue}>{pausedSIPs}</Text>
            </View>
          </View>
        </View>

        {/* Financial Summary */}
        <View style={styles.financialSummary}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryColumn}>
              <Text style={styles.summaryLabel}>Total Invested</Text>
              <Text style={styles.summaryInvested}>
                {formatCurrency(totals?.totalInvested || 0)}
              </Text>
            </View>
            <View style={styles.summaryColumn}> 
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
            <View style={styles.summaryColumn}>
              <Text style={styles.summaryLabel}>Current Value</Text>
              <Text style={styles.summaryCurrent}>
                {formatCurrency(totals?.totalCurrentValue || 0)}
              </Text>
            </View>
          </View>
          
          {/* <View style={styles.totalGainLoss}>
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
          </View> */}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
     <Loader />
    );
  }

  if (error || !sipSummary) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Unable to load data. Please try again.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <Text style={styles.pageTitle}>
        SIP Investment Portfolio
      </Text>

      <SipSummaryCard />

      <View style={styles.schemesHeader}>
        <Text style={styles.schemesTitle}>Investment Schemes</Text>
        <Text style={styles.schemesCount}>{schemeArray.length} Schemes</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {schemeArray.map((scheme, idx) => (
          <SchemeCard
            idx={idx}
            key={scheme?.schemeCode || Math.random()}
            scheme={scheme}
          />
        ))}
        
        {schemeArray.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No investment schemes found</Text>
          </View>
        )}
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
    backgroundColor: 'transparent',
  },
  pageTitle: {
    fontSize: widthToDp(6),
    fontWeight: '600',
    textAlign: 'center',
    marginTop: heightToDp(2),
    marginBottom: heightToDp(2),
    color: '#2C3E50',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: widthToDp(4),
    marginBottom: heightToDp(2),
    padding: widthToDp(4),
    borderRadius: widthToDp(3),
    borderWidth: 1,
    borderColor: '#dfb049ff',
    elevation: 2,
    shadowColor: '#dfb049ff',
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
    color: '#dfb049ff',
    marginBottom: heightToDp(2),
    textAlign: 'center',
  },
  sipCountsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  sipCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: heightToDp(1),
  },
  sipCountItem: {
    flex: 1,
    alignItems: 'center',
  },
  sipCountLabel: {
    fontSize: widthToDp(3.2),
    color: '#666666',
    marginBottom: heightToDp(0.5),
  },
  sipCountValue: {
    fontSize: widthToDp(4.5),
    fontWeight: 'bold',
    color: '#dfb049ff',
  },
  activeCount: {
    color: '#28A745',
  },
  cancelledCount: {
    color: '#DC3545',
  },
  financialSummary: {
    marginTop: heightToDp(1),
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
    color: '#dfb049ff',
  },
  summaryCurrent: {
    fontSize: widthToDp(4),
    fontWeight: '600',
    color: '#dfb049ff',
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
  profit: {
    color: '#28A745',
  },
  loss: {
    color: '#DC3545',
  },
  schemesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: widthToDp(4),
    marginBottom: heightToDp(1),
  },
  schemesTitle: {
    fontSize: widthToDp(4.2),
    fontWeight: '600',
    color: '#2C3E50',
  },
  schemesCount: {
    fontSize: widthToDp(3.5),
    color: '#666666',
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
  schemeInfo: {
    flex: 1,
  },
  schemeName: {
    fontSize: widthToDp(3.8),
    fontWeight: '600',
    color: '#dfb049ff',
    marginBottom: heightToDp(0.2),
  },
  schemeCode: {
    fontSize: widthToDp(3),
    color: '#666666',
    fontWeight: '400',
  },
  statusContainer: {
    paddingHorizontal: widthToDp(2),
    paddingVertical: heightToDp(0.5),
    borderRadius: widthToDp(1),
    marginLeft: widthToDp(2),
  },
  activeStatus: {
    backgroundColor: '#28A745',
  },
  cancelledStatus: {
    backgroundColor: '#DC3545',
  },
  statusText: {
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
  sipStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: heightToDp(1),
    paddingTop: heightToDp(1),
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  sipStat: {
    alignItems: 'center',
    flex: 1,
  },
  sipStatLabel: {
    fontSize: widthToDp(2.8),
    color: '#666666',
    marginBottom: heightToDp(0.3),
  },
  sipStatValue: {
    fontSize: widthToDp(3.2),
    fontWeight: '600',
    color: '#dfb049ff',
  },
  gainLossRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: widthToDp(4),
    textAlign: 'center',
    marginTop: heightToDp(20),
    color: '#666666',
  },
  errorText: {
    fontSize: widthToDp(4),
    textAlign: 'center',
    marginTop: heightToDp(20),
    color: '#DC3545',
  },
  emptyState: {
    alignItems: 'center',
    padding: widthToDp(8),
  },
  emptyStateText: {
    fontSize: widthToDp(3.8),
    color: '#666666',
    textAlign: 'center',
  },
});

export default InvestmentList;