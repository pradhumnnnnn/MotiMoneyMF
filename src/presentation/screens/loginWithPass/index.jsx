import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
  Keyboard,
  Alert,
  BackHandler,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import * as Config from '../../../helpers/Config';
import { widthToDp, heightToDp } from '../../../helpers/Responsive';
import { apiPostService } from '../../../helpers/services';
import {
  setBiometricPin,
  setLoginData,
  setRegi,
  setRegiId,
} from '../../../store/slices/loginSlice';
import { storeData } from '../../../helpers/localStorage';
import BiometricLogin from '../BiometricLogin';
import Rbutton from '../../../components/Rbutton';
import { setPass } from '../../../store/slices/passSlice';

export default function LoginWithPass() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const LoginData = useSelector(state => state.login.loginData);
  const DATA = useSelector(state => state.login);

  const pinRefs = useRef([]);

  const [clientCode, setClientCode] = useState('');
  const [password, setPassword] = useState(''); // stores "1234"
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (DATA.enabled === true) {
      handleBiometricAuth();
    }
  }, []);

  const handleBiometricAuth = async () => {
    try {
      setIsLoading(true);
      const rnBiometrics = new ReactNativeBiometrics();
      const { available } = await rnBiometrics.isSensorAvailable();

      if (!available) {
        Alert.alert('Biometrics not available', 'Please login normally');
        return;
      }

      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: 'Sign in using biometric authentication',
        cancelButtonText: 'Cancel',
      });

      if (success) {
        await verifyWithServer();
      }
    } catch (error) {
      Alert.alert('Biometric auth failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyWithServer = async () => {
    try {
      const response = await fetch(
        `${Config.baseUrl}/api/v1/user/function/verify/refresh`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            refreshToken: `${LoginData.refreshToken}`,
          },
        },
      );

      const result = await response.json();

      if (response.ok && result?.accessToken) {
        await storeData(Config.store_key_login_details, result.accessToken);
        await storeData(Config.clientCode, LoginData?.user?.clientCode);

        navigation.reset({
          index: 0,
          routes: [{ name: 'Profile' }],
        });
      } else {
        Alert.alert('Authentication Failed', 'Please login normally');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to authenticate.');
    }
  };

  useEffect(() => {
    const backAction = () => {
      Alert.alert('Exit App', 'Are you sure you want to exit?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (clientCode || password) {
      setErrorMessage('');
      setValidationErrors({});
    }
  }, [clientCode, password]);

  const validateInputs = () => {
    const errors = {};

    if (!clientCode.trim()) {
      errors.clientCode = 'Client code is required';
    } else if (!/^[A-Za-z0-9]+$/.test(clientCode.trim())) {
      errors.clientCode = 'Client code should contain only letters and numbers';
    } else if (clientCode.trim().length < 4) {
      errors.clientCode = 'Client code should be at least 4 characters';
    }

    if (password.length !== 4) {
      errors.password = 'Password must be 4 digits';
    }

    return errors;
  };

  const handlePinChange = (value, index) => {
    if (value && !/^\d$/.test(value)) return;

    let newPin = password.split('');
    newPin[index] = value;
    const updated = newPin.join('');
    setPassword(updated);

    if (value && index < 3) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handlePinBackspace = (e, index) => {
    if (e.nativeEvent.key === 'Backspace') {
      let newPin = password.split('');

      if (!newPin[index] && index > 0) {
        pinRefs.current[index - 1]?.focus();
      }

      newPin[index] = '';
      setPassword(newPin.join(''));
    }
  };

  const handleLoginWithPassword = async () => {
    const errors = validateInputs();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        referenceId: clientCode.trim(),
        password: password,
      };

      const response = await apiPostService('/api/v1/user/onboard/login-pwd/verify', payload);

      if (response?.status === 200 && response?.data?.accessToken) {
        dispatch(setBiometricPin(response?.data?.user?.passwordPlain));
        await storeData(Config.store_key_login_details, response?.data?.accessToken);

        if (response?.data?.user?.passwordPlain !== '') {
          dispatch(setPass(true));
        }

        if (response?.data?.user?.clientCode) {
          await storeData(Config.clientCode, response?.data?.user?.clientCode);
        }

        dispatch(setLoginData(response?.data));

        navigation.reset({
          index: 0,
          routes: [{ name: 'Profile' }],
        });
      }
    } catch (err) {
      setErrorMessage('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    return clientCode.trim().length >= 4 && password.length === 4;
  };

  const renderLoginScreen = () => (
    <View style={simpleStyles.container}>
      <Text style={simpleStyles.mainTitle}>Login with Client Code</Text>

      {/* Client Code */}
      <View style={simpleStyles.inputGroup}>
        <Text style={simpleStyles.inputLabel}>Client Code</Text>
        <View
          style={[
            simpleStyles.inputOuterContainer,
            validationErrors.clientCode && simpleStyles.inputOuterError,
          ]}
        >
          <View
            style={[
              simpleStyles.inputInnerContainer,
              validationErrors.clientCode && simpleStyles.inputInnerError,
            ]}
          >
            <TextInput
              style={simpleStyles.input}
              placeholder="Enter your client code"
              placeholderTextColor="#AAB7B8"
              value={clientCode}
              onChangeText={setClientCode}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {validationErrors.clientCode && (
          <Text style={simpleStyles.fieldErrorText}>
            {validationErrors.clientCode}
          </Text>
        )}
      </View>

      {/* PIN Input (OTP-style Boxes) */}
      <View style={simpleStyles.inputGroup}>
        <Text style={simpleStyles.inputLabel}>Password</Text>

        <View style={simpleStyles.otpOuterContainer}>
          {[0, 1, 2, 3].map((_, index) => (
            <View key={index} style={simpleStyles.otpDigitContainer}>
              <View
                style={[
                  simpleStyles.otpInnerContainer,
                  password[index] && simpleStyles.otpInnerFilled,
                  validationErrors.password && !password[index] && simpleStyles.otpInnerError,
                ]}
              >
                <TextInput
                  ref={ref => (pinRefs.current[index] = ref)}
                  style={simpleStyles.otpInput}
                  value={password[index] || ''}
                  onChangeText={value => handlePinChange(value, index)}
                  onKeyPress={e => handlePinBackspace(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                />
              </View>
            </View>
          ))}
        </View>

        {validationErrors.password && (
          <Text style={simpleStyles.fieldErrorText}>{validationErrors.password}</Text>
        )}
      </View>

      {errorMessage ? <Text style={simpleStyles.errorText}>{errorMessage}</Text> : null}

      <View style={simpleStyles.spacer} />

      <View style={simpleStyles.footer}>
        <Rbutton
          title="Login"
          onPress={handleLoginWithPassword}
          disabled={!isFormValid()}
          loading={isLoading}
        />

        <TouchableOpacity
          style={simpleStyles.otpLoginButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={simpleStyles.otpLoginText}>Login with OTP instead</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return DATA?.enabled === true || DATA.pin ? (
    <BiometricLogin handleBiometricAuth={handleBiometricAuth} />
  ) : (
    <SafeAreaView style={simpleStyles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={simpleStyles.keyboardContainer}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={simpleStyles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {renderLoginScreen()}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const simpleStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: widthToDp(6),
    paddingTop: heightToDp(5),
    backgroundColor: '#FFFFFF',
  },
  mainTitle: {
    fontSize: widthToDp(6.5),
    fontWeight: 'bold',
    color: '#1C1C1C',
    marginBottom: heightToDp(4),
    fontFamily: Config.fontFamilys?.Poppins_ExtraBold || 'System',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: heightToDp(3),
  },
  inputLabel: {
    fontSize: widthToDp(3.5),
    color: '#7A7A7A',
    marginBottom: heightToDp(1),
    fontFamily: Config.fontFamilys?.Poppins_Medium || 'System',
  },
  inputOuterContainer: {
    padding: 2,
    borderRadius: 8,
    backgroundColor: '#000000',
    alignSelf: 'stretch',
  },
  inputOuterError: {
    backgroundColor: '#A0A0A0',
  },
  inputInnerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: widthToDp(4),
    paddingVertical: heightToDp(1.5),
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  inputInnerError: {
    backgroundColor: '#F0F0F0',
  },
  input: {
    flex: 1,
    height: heightToDp(4),
    padding: 0,
    fontSize: widthToDp(4.5),
    color: '#1C1C1C',
    fontFamily: Config.fontFamilys?.Poppins_SemiBold || 'System',
  },

  /* OTP Styles used for PIN Input */
  otpOuterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: heightToDp(1),
  },
  otpDigitContainer: {
    padding: 2,
    borderRadius: 8,
    backgroundColor: '#000000',
  },
  otpInnerContainer: {
    width: widthToDp(14),
    height: widthToDp(14),
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  otpInnerFilled: {
    backgroundColor: '#E6F0FF',
  },
  otpInnerError: {
    backgroundColor: '#F0F0F0',
  },
  otpInput: {
    width: '100%',
    height: '100%',
    fontSize: widthToDp(6),
    fontWeight: 'bold',
    color: '#1C1C1C',
    textAlign: 'center',
    fontFamily: Config.fontFamilys?.Poppins_Bold || 'System',
  },

  fieldErrorText: {
    color: '#E74C3C',
    fontSize: widthToDp(3.5),
    marginTop: heightToDp(1),
  },
  errorText: {
    color: '#E74C3C',
    fontSize: widthToDp(3.5),
    textAlign: 'center',
    marginTop: heightToDp(2),
  },

  spacer: { flex: 1 },

  footer: { paddingVertical: heightToDp(1) },

  otpLoginButton: {
    marginTop: heightToDp(2),
    paddingVertical: heightToDp(1.5),
    alignItems: 'center',
  },
  otpLoginText: {
    fontSize: widthToDp(3.8),
    fontWeight: '600',
    color: '#000',
    textDecorationLine: 'underline',
  },
});
