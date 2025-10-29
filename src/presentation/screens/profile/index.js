import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  StatusBar,
  Dimensions,
  BackHandler,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { widthToDp, heightToDp } from '../../../helpers/Responsive';
import * as Config from '../../../helpers/Config';
import * as Icons from '../../../helpers/Icons';
import { useDispatch, useSelector } from 'react-redux';
import SInfoSvg from '../../svgs';
import { getData } from '../../../helpers/localStorage';
import useGetPortfolioData from '../../../hooks/getPortfolio';
import StartInvestingCard from '../../../components/StartInvstingCard';
import QuickLinksSection from '../../../components/QuickLinksSection';
import SIPCalculator from '../../calculator/sipCalculator';
import InvestmentPortfolio from '../../../components/InvesmentPortfolio';
import Collection from '../../../components/Collection';
import DeviceInfo from 'react-native-device-info';
import MandateAlert from '../../../components/MandateAlert';
import { setMandateAlert } from '../../../store/slices/marketSlice';
import LinearGradient from 'react-native-linear-gradient';
import bgVector from '../../../assets/Icons/vector.png';
import HandAnimation from '../../../components/handAnimation';

const { width: screenWidth } = Dimensions.get('window');

export default function Profile({ navigation }) {
  const dispatch = useDispatch();
  const Alert = useSelector(state => state.marketWatch.mandateAlert);
  const loginData = useSelector(state => state?.login?.loginData);
  const [expandedPortfolio, setExpandedPortfolio] = useState(false);
  const { portfolioData, loading, error, refetch } = useGetPortfolioData();
  const [isLoading, setIsLoading] = useState(true);

  const [mandateData, setMandateData] = useState(null);
  const [showMandateAlert, setShowMandateAlert] = useState(false);
  const [showBackButton, setShowBackButton] = useState(false);
  const [greetText, setGreetText] = useState(true);

  useEffect(() => {
    console.log('useEffectCalled');
    fetchingMandate();
  }, []);

  useEffect(() => {
    const backAction = () => {
      BackHandler.exitApp();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  const fetchingMandate = async () => {
    setIsLoading(true);
    try {
      const rawToken = await getData(Config.store_key_login_details);
      const clientCode = await getData(Config.clientCode);
      const cleanToken = rawToken ? rawToken.replace(/"/g, '') : '';

      const response = await fetch(
        `${Config.baseUrl}/api/client/registration/mandate/history`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            clientcode: clientCode?.replace(/^"|"$/g, ''),
            Authorization: cleanToken,
          },
        },
      );

      const data = await response.json();
      console.log('Mandate history response:', data);

      if (response.ok) {
        const filteredIds = data?.mandates?.filter(item => item.UMRNNo);
        console.log('filter mandate', filteredIds);

        if (!filteredIds || filteredIds.length === 0) {
          console.log('No mandate found, showing alert');
          if (Alert === false) {
            setMandateData(false);
            setShowMandateAlert(true);
          }
        } else {
          console.log('Mandate found, not showing alert');
          setMandateData(true);
          setShowMandateAlert(false);
        }
      } else {
        Alert.alert(
          'Error',
          data?.message || 'Failed to fetch mandate history',
        );
        setMandateData(null);
        setShowMandateAlert(false);
      }
    } catch (error) {
      console.error('Error fetching mandate history:', error);
      Alert.alert('Error', 'Network error. Please try again.');
      setMandateData(null);
      setShowMandateAlert(false);
    } finally {
      setIsLoading(false);
    }
  };

  const Return = portfolioData?.investment?.percentageChange > 0;

  const handleCloseMandateAlert = () => {
    console.log('Closing mandate alert');
    setShowMandateAlert(false);
    dispatch(setMandateAlert(true));
  };

  const handleCreateMandate = () => {
    dispatch(setMandateAlert(true));
    navigation.navigate('BankMandate');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12)
      return `Good Morning, ${loginData?.user?.primaryHolderFirstName}`;
    if (hour < 17)
      return `Good Afternoon, ${loginData?.user?.primaryHolderFirstName}`;
    return `Good Evening, ${loginData?.user?.primaryHolderFirstName}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === 'android' && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="light-content" backgroundColor="#2B8DF6" />
      {isLoading ? (
        <HandAnimation />
      ) : (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.headerContainer}>
            <LinearGradient
              colors={['#2B8DF6', '#2B8DF6']}
              style={styles.headerGradientOverlay}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <Image
                source={bgVector}
                style={[StyleSheet.absoluteFillObject, { opacity: 0.5 }]}
                resizeMode="cover"
              />
              <View style={styles.headerContainer}>
                <View style={styles.leftHeader}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Settings')}
                    style={styles.iconButton}
                  >
                    <Image source={Icons.logo} style={styles.logoImage} />
                  </TouchableOpacity>
                  {greetText && (
                    <View style={styles.greetingContainer}>
                      <Text style={styles.greetingText} numberOfLines={1}>
                        Hello {loginData?.user?.primaryHolderFirstName}!
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => navigation.navigate('Search')}
                  style={styles.iconButton}
                >
                  <SInfoSvg.BellIcon
                    width={24}
                    height={25}
                    color={Config.Colors.white}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.portfolioHeader}>
                <View style={styles.portfolioLeft}>
                  <Text style={styles.portfolioBalanceTitle}>
                    PORTFOLIO BALANCE
                  </Text>
                  <Text style={styles.portfolioBalanceAmount}>
                    ₹
                    {portfolioData?.investment?.currentInvestedAmount?.toLocaleString() ||
                      '0'}
                  </Text>
                </View>
                <View style={styles.portfolioRight}>
                  <View style={styles.returnsBadge}>
                    <Text style={styles.returnsText}>
                      ↑12.30% over the last hour
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.portfolioBalanceCard}>
                <View style={styles.metricsContainer}>
                  <View style={styles.metricRow}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Invested</Text>
                      <Text style={styles.metricValue}>
                        ₹{' '}
                        {portfolioData?.investment?.totalInvestedAmount?.toLocaleString() ||
                          '15,234.00'}
                      </Text>
                    </View>

                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Current Returns</Text>
                      <Text
                        style={[
                          styles.metricValue,
                          Return
                            ? styles.positiveReturns
                            : styles.negativeReturns,
                        ]}
                      >
                        {Return ? '+' : '-'} ₹
                        {Math.abs(
                          (portfolioData?.investment?.currentInvestedAmount ||
                            0) -
                            (portfolioData?.investment?.totalInvestedAmount ||
                              0),
                        )?.toFixed(2) || '0.00'}
                      </Text>
                    </View>

                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Returns %</Text>
                      <View style={styles.returnsPercentageContainer}>
                        <Text
                          style={[
                            styles.metricValue,
                            Return
                              ? styles.positiveReturns
                              : styles.negativeReturns,
                          ]}
                        >
                          {Return ? '+' : '-'}
                          {portfolioData?.investment?.percentageChange ||
                            '12.30'}
                          %
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
          >
            <StartInvestingCard
              onStartInvesting={() => navigation.navigate('SipScheme')}
            />
            <Collection />
            <QuickLinksSection onViewAll={() => {}} />
            <SIPCalculator />
            <InvestmentPortfolio />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Powered By Finovo Tech</Text>
              <Text style={styles.footerText}>
                Version : v.{DeviceInfo.getVersion()}
              </Text>
            </View>
          </ScrollView>

          <MandateAlert
            visible={showMandateAlert}
            onClose={handleCloseMandateAlert}
            showCancelButton={true}
            onCreateMandate={handleCreateMandate}
          />
        </SafeAreaView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.Colors.white,
  },
  safeArea: {
    flex: 1,
  },
  headerImageBackground: {
    minHeight: heightToDp(45),
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  headerGradientOverlay: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 10 : 10,
    paddingBottom: 25,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: widthToDp(4),
  },
  androidStatusBar: {
    height: StatusBar.currentHeight,
    backgroundColor: '#2B8DF6',
  },
  scrollView: {
    flex: 1,
    backgroundColor: Config.Colors.white,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingTop: heightToDp(2),
  },
  logoImage: {
    width: widthToDp(10),
    height: widthToDp(10),
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Config.Colors.white,
    backgroundColor: Config.Colors.white,
  },
  iconButton: {
    width: widthToDp(10),
    height: widthToDp(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingContainer: {
    marginLeft: widthToDp(3),
  },
  greetingText: {
    color: Config.Colors.white,
    fontFamily: Config.fontFamilys.Poppins_SemiBold,
    fontWeight: '600',
    fontSize: widthToDp(4.5),
  },
  portfolioBalanceCard: {
    // backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: widthToDp(4),
    // marginTop: heightToDp(3),
    borderRadius: widthToDp(1),
    padding: widthToDp(5),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  portfolioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: heightToDp(3),
    paddingHorizontal: widthToDp(3.5),
    paddingTop: heightToDp(2),
  },
  portfolioLeft: {
    flex: 1,
  },
  portfolioRight: {
    marginLeft: widthToDp(2),
  },
  portfolioBalanceTitle: {
    color: Config.Colors.white,
    fontFamily: Config.fontFamilys.Poppins_Medium,
    fontSize: widthToDp(3.2),
    opacity: 0.9,
    letterSpacing: 0.8,
    // marginBottom: heightToDp(1),
  },
  portfolioBalanceAmount: {
    color: Config.Colors.white,
    fontFamily: Config.fontFamilys.Poppins_Bold,
    fontSize: widthToDp(7),
  },
  returnsBadge: {
    backgroundColor: 'rgba(76, 217, 100, 0.2)',
    paddingHorizontal: widthToDp(2.5),
    paddingVertical: heightToDp(0.8),
    borderRadius: widthToDp(3),
    borderWidth: 1,
    borderColor: 'rgba(76, 217, 100, 0.4)',
  },
  returnsText: {
    color: '#4CD964',
    fontFamily: Config.fontFamilys.Poppins_Medium,
    fontSize: widthToDp(2.5),
  },
  metricsContainer: {
    marginTop: heightToDp(1),
  },
  metricRow: {
    height: heightToDp(8),
    // flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metricItem: {
    width: '100%',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    color: Config.Colors.white,
    fontFamily: Config.fontFamilys.Poppins_Regular,
    fontSize: widthToDp(3.2),
    opacity: 0.8,
    marginBottom: heightToDp(0.5),
  },
  metricValue: {
    color: Config.Colors.white,
    fontFamily: Config.fontFamilys.Poppins_SemiBold,
    fontSize: widthToDp(3.8),
  },
  positiveReturns: {
    color: '#4CD964',
  },
  negativeReturns: {
    color: '#FF3B30',
  },
  returnsPercentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: widthToDp(1),
  },
  footer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: heightToDp(10),
    paddingHorizontal: widthToDp(4),
    marginTop: heightToDp(2),
  },
  footerText: {
    fontSize: widthToDp(2.5),
    color: Config.Colors.textColor.textColor_5,
    textAlign: 'center',
    marginBottom: heightToDp(0.5),
  },
});
