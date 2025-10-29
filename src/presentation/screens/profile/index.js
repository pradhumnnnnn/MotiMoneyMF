import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  Image,
  TouchableOpacity,
  Platform,
  StatusBar,
  Dimensions,
  BackHandler,
  ActivityIndicator,
} from "react-native";
import { widthToDp, heightToDp } from "../../../helpers/Responsive";
import * as Config from "../../../helpers/Config";
import * as Icons from "../../../helpers/Icons";
import { useDispatch, useSelector } from "react-redux";
import SInfoSvg from "../../svgs";
import { getData } from "../../../helpers/localStorage";
import useGetPortfolioData from "../../../hooks/getPortfolio";
import StartInvestingCard from "../../../components/StartInvstingCard";
import QuickLinksSection from "../../../components/QuickLinksSection";
import SIPCalculator from "../../calculator/sipCalculator";
import InvestmentPortfolio from "../../../components/InvesmentPortfolio";
import Collection from "../../../components/Collection";
import DeviceInfo from "react-native-device-info";
import MandateAlert from "../../../components/MandateAlert";
import { setMandateAlert } from "../../../store/slices/marketSlice";
import LinearGradient from "react-native-linear-gradient";
import bgVector from "../../../assets/Icons/vector.png";
import HandAnimation from "../../../components/handAnimation";

const { width: screenWidth } = Dimensions.get("window");

export default function Profile({ navigation }) {
  const dispatch = useDispatch();
  const Alert = useSelector((state) => state.marketWatch.mandateAlert);
  const loginData = useSelector((state) => state?.login?.loginData);
  const [isLoading, setIsLoading] = useState(true);
  const [mandateData, setMandateData] = useState(null);
  const [showMandateAlert, setShowMandateAlert] = useState(false);
  const { portfolioData } = useGetPortfolioData();
  const Return = portfolioData?.investment?.percentageChange > 0;

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchingMandate();
  }, []);

  useEffect(() => {
    const backAction = () => {
      BackHandler.exitApp();
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, []);

  const fetchingMandate = async () => {
    setIsLoading(true);
    try {
      const rawToken = await getData(Config.store_key_login_details);
      const clientCode = await getData(Config.clientCode);
      const cleanToken = rawToken ? rawToken.replace(/"/g, "") : "";
      const response = await fetch(
        `${Config.baseUrl}/api/client/registration/mandate/history`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            clientcode: clientCode?.replace(/^"|"$/g, ""),
            Authorization: cleanToken,
          },
        }
      );

      const data = await response.json();
      const filteredIds = data?.mandates?.filter((item) => item.UMRNNo);
      if (!filteredIds || filteredIds.length === 0) {
        if (Alert === false) {
          setMandateData(false);
          setShowMandateAlert(true);
        }
      } else {
        setMandateData(true);
        setShowMandateAlert(false);
      }
    } catch (error) {
      console.error("Error fetching mandate history:", error);
      setMandateData(null);
      setShowMandateAlert(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseMandateAlert = () => {
    setShowMandateAlert(false);
    dispatch(setMandateAlert(true));
  };

  const handleCreateMandate = () => {
    dispatch(setMandateAlert(true));
    navigation.navigate("BankMandate");
  };

  // Animated values
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [heightToDp(35), heightToDp(16)],
    extrapolate: "clamp",
  });

  const contentOpacity = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === "android" && <View style={styles.androidStatusBar} />}
      <StatusBar barStyle="light-content" backgroundColor="#f0b538" />

      {isLoading ? (
        <HandAnimation />
      ) : (
        <SafeAreaView style={styles.safeArea}>
          {/* Animated Header */}
          <Animated.View
            style={[styles.animatedHeader, { height: headerHeight }]}
          >
            <LinearGradient
              colors={["#f0b538", "#f0b538"]}
              style={styles.headerGradientOverlay}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <Image
                source={bgVector}
                style={[StyleSheet.absoluteFillObject, { opacity: 0.5 }]}
                resizeMode="cover"
              />

              {/* Fixed Header Row */}
              <View style={styles.headerRow}>
                <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",width:screenWidth - widthToDp(8)}}>
                <View style={styles.leftHeader}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Settings")}
                    style={styles.iconButton}
                  >
                    <Image source={Icons.logo} style={styles.logoImage} />
                  </TouchableOpacity>
                  <Text style={styles.greetingText} numberOfLines={1}>
                    Hello {loginData?.user?.primaryHolderFirstName}!
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => navigation.navigate("Search")}
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
                        "0"}
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
              </View>

              {/* Collapsing Portfolio Info */}
              <Animated.View
                style={{ opacity: contentOpacity, marginTop: heightToDp(10) }}
              >
                <View style={styles.portfolioBalanceCard}>
                  <View style={styles.metricsContainer}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Invested</Text>
                      <Text style={styles.metricValue}>
                        ₹{" "}
                        {portfolioData?.investment?.totalInvestedAmount?.toLocaleString() ||
                          "15,234.00"}
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
                        {Return ? "+" : "-"} ₹
                        {Math.abs(
                          (portfolioData?.investment?.currentInvestedAmount ||
                            0) -
                            (portfolioData?.investment?.totalInvestedAmount ||
                              0)
                        )?.toFixed(2) || "0.00"}
                      </Text>
                    </View>

                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Returns %</Text>
                      <Text
                        style={[
                          styles.metricValue,
                          Return
                            ? styles.positiveReturns
                            : styles.negativeReturns,
                        ]}
                      >
                        {Return ? "+" : "-"}
                        {portfolioData?.investment?.percentageChange || "12.30"}
                        %
                      </Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            </LinearGradient>
          </Animated.View>

          {/* Scrollable Section */}
          <Animated.ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
          >
            <StartInvestingCard
              onStartInvesting={() => navigation.navigate("SipScheme")}
            />
            <Collection />
            <QuickLinksSection onViewAll={() => {}} />
            <SIPCalculator />
            <InvestmentPortfolio />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Powered By MotiMoney</Text>
              <Text style={styles.footerText}>
                Version : v.{DeviceInfo.getVersion()}
              </Text>
            </View>
          </Animated.ScrollView>

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
  androidStatusBar: {
    height: StatusBar.currentHeight,
    backgroundColor: "#f0b538",
  },
  animatedHeader: {
    overflow: "hidden",
  },
  headerGradientOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 20,
  },
  headerRow: {
    position: "absolute",
    top: heightToDp(2),
    left: 0,
    right: 0,
    zIndex: 2,
    // flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: widthToDp(4),
  },
  leftHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoImage: {
    width: widthToDp(10),
    height: widthToDp(10),
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Config.Colors.white,
    backgroundColor: Config.Colors.white,
  },
  iconButton: {
    width: widthToDp(10),
    height: widthToDp(10),
    justifyContent: "center",
    alignItems: "center",
  },
  greetingText: {
    color: Config.Colors.white,
    fontFamily: Config.fontFamilys.Poppins_SemiBold,
    fontWeight: "600",
    fontSize: widthToDp(4.5),
    marginLeft: widthToDp(3),
  },
  portfolioHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: heightToDp(2),
    paddingVertical: widthToDp(4),
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
  },
  portfolioBalanceAmount: {
    color: Config.Colors.white,
    fontFamily: Config.fontFamilys.Poppins_Bold,
    fontSize: widthToDp(7),
  },
  portfolioBalanceCard: {
    marginHorizontal: widthToDp(4),
    borderRadius: widthToDp(1),
    padding: widthToDp(5),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  returnsBadge: {
    backgroundColor: "rgba(76, 217, 100, 0.2)",
    paddingHorizontal: widthToDp(2.5),
    paddingVertical: heightToDp(0.8),
    borderRadius: widthToDp(3),
    borderWidth: 1,
    borderColor: "rgba(76, 217, 100, 0.4)",
  },
  returnsText: {
    color: "#4CD964",
    fontFamily: Config.fontFamilys.Poppins_Medium,
    fontSize: widthToDp(2.5),
  },
  metricsContainer: {
    marginTop: heightToDp(1),
  },
  metricItem: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: heightToDp(0.5),
  },
  metricLabel: {
    color: Config.Colors.white,
    fontFamily: Config.fontFamilys.Poppins_Regular,
    fontSize: widthToDp(3.2),
    opacity: 0.8,
  },
  metricValue: {
    color: Config.Colors.white,
    fontFamily: Config.fontFamilys.Poppins_SemiBold,
    fontSize: widthToDp(3.8),
  },
  positiveReturns: {
    color: "#4CD964",
  },
  negativeReturns: {
    color: "#FF3B30",
  },
  scrollView: {
    flex: 1,
    backgroundColor: Config.Colors.white,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingTop: heightToDp(2),
  },
  footer: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: heightToDp(10),
    paddingHorizontal: widthToDp(4),
    marginTop: heightToDp(2),
  },
  footerText: {
    fontSize: widthToDp(2.5),
    color: Config.Colors.textColor.textColor_5,
    textAlign: "center",
    marginBottom: heightToDp(0.5),
  },
});
