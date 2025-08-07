import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  VStack,
  Text,
  Button,
  Image,
  Center,
  useColorModeValue
} from 'native-base';
import { Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface IntroScreenProps {
  onGetStarted: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onGetStarted }) => {
  const { height, width } = Dimensions.get('window');
  
  // Animation values
  const logoScale = useRef(new Animated.Value(1.2)).current;
  const logoTranslateY = useRef(new Animated.Value(50)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  const mottoOpacity = useRef(new Animated.Value(0)).current;
  const mottoTranslateY = useRef(new Animated.Value(30)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(30)).current;
  
  // Background animation values
  const circle1Opacity = useRef(new Animated.Value(0)).current;
  const circle2Opacity = useRef(new Animated.Value(0)).current;
  const circle3Opacity = useRef(new Animated.Value(0)).current;
  
  const [animationComplete, setAnimationComplete] = useState(false);
  
  const bgGradient = useColorModeValue(
    ['#1E40AF', '#3B82F6', '#6366F1'],
    ['#1E293B', '#0F172A']
  );
  
  useEffect(() => {
    // Start the animation sequence
    startIntroAnimation();
  }, []);
  
  const startIntroAnimation = () => {
    // Start background animations
    Animated.stagger(200, [
      Animated.timing(circle1Opacity, {
        toValue: 0.1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(circle2Opacity, {
        toValue: 0.08,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(circle3Opacity, {
        toValue: 0.06,
        duration: 1400,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Step 1: Logo fade in and scale down
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Step 2: Logo moves up to final position
      Animated.timing(logoTranslateY, {
        toValue: -80,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        // Step 3: App name appears
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(titleTranslateY, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Step 4: Motto appears
          setTimeout(() => {
            Animated.parallel([
              Animated.timing(mottoOpacity, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
              }),
              Animated.timing(mottoTranslateY, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
              }),
            ]).start(() => {
              // Step 5: Button appears
              setTimeout(() => {
                Animated.parallel([
                  Animated.timing(buttonOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                  }),
                  Animated.timing(buttonTranslateY, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                  }),
                ]).start(() => {
                  setAnimationComplete(true);
                });
              }, 300);
            });
          }, 300);
        });
      });
    });
  };
  
  return (
    <Box flex={1}>
      <LinearGradient
        colors={bgGradient}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: height,
        }}
      />
      
      {/* Floating background elements */}
      <Animated.View
        style={{
          position: 'absolute',
          top: height * 0.15,
          left: width * 0.1,
          opacity: circle1Opacity,
        }}
      >
        <Box
          width={200}
          height={200}
          borderRadius="full"
          bg="white"
          opacity={0.1}
        />
      </Animated.View>
      
      <Animated.View
        style={{
          position: 'absolute',
          top: height * 0.6,
          right: width * 0.1,
          opacity: circle2Opacity,
        }}
      >
        <Box
          width={150}
          height={150}
          borderRadius="full"
          bg="white"
          opacity={0.08}
        />
      </Animated.View>
      
      <Animated.View
        style={{
          position: 'absolute',
          top: height * 0.3,
          right: width * 0.2,
          opacity: circle3Opacity,
        }}
      >
        <Box
          width={100}
          height={100}
          borderRadius="full"
          bg="white"
          opacity={0.06}
        />
      </Animated.View>
      
      <Center flex={1} px={8}>
        <VStack space={6} alignItems="center" width="100%">
          {/* Logo */}
          <Animated.View
            style={{
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                { translateY: logoTranslateY }
              ],
            }}
          >
            <Box
              width={140}
              height={140}
              borderRadius="full"
              bg="white"
              shadow={9}
              alignItems="center"
              justifyContent="center"
              borderWidth={4}
              borderColor="rgba(255,255,255,0.3)"
            >
              {/* Modern Banking Logo */}
              <VStack alignItems="center" space={1}>
                <Text
                  fontSize="5xl"
                  fontWeight="bold"
                  color="blue.600"
                  fontFamily="Inter-Bold"
                  lineHeight="xs"
                >
                  P
                </Text>
                <Box
                  width={8}
                  height={1}
                  bg="blue.600"
                  borderRadius="full"
                />
              </VStack>
            </Box>
          </Animated.View>
          
          {/* App Name */}
          <Animated.View
            style={{
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            }}
          >
            <VStack alignItems="center" space={2}>
              <Text
                fontSize="5xl"
                fontWeight="bold"
                color="white"
                textAlign="center"
                fontFamily="Inter-Bold"
                letterSpacing="widest"
                textShadowColor="rgba(0,0,0,0.3)"
                textShadowOffset={{ width: 0, height: 2 }}
                textShadowRadius={4}
              >
                PAYDE
              </Text>
              <Box
                width={16}
                height={1}
                bg="white"
                borderRadius="full"
                opacity={0.8}
              />
            </VStack>
          </Animated.View>
          
          {/* Motto */}
          <Animated.View
            style={{
              opacity: mottoOpacity,
              transform: [{ translateY: mottoTranslateY }],
            }}
          >
            <Text
              fontSize="lg"
              color="white"
              textAlign="center"
              fontFamily="Inter-Regular"
              opacity={0.9}
              letterSpacing="wide"
            >
              Global banking made easy
            </Text>
          </Animated.View>
          
          <Box height={8} />
          
          {/* Get Started Button */}
          <Animated.View
            style={{
              opacity: buttonOpacity,
              transform: [{ translateY: buttonTranslateY }],
              width: '100%',
            }}
          >
            <Button
              onPress={onGetStarted}
              size="lg"
              borderRadius="full"
              bg="white"
              _text={{
                color: 'blue.600',
                fontSize: 'lg',
                fontWeight: 'bold',
                fontFamily: 'Inter-Bold',
                letterSpacing: 'wide',
              }}
              _pressed={{
                bg: 'gray.100',
                transform: [{ scale: 0.96 }],
              }}
              shadow={8}
              width="100%"
              height={16}
              borderWidth={2}
              borderColor="rgba(255,255,255,0.2)"
            >
              Get Started
            </Button>
          </Animated.View>
          
          {animationComplete && (
            <Animated.View
              style={{
                opacity: buttonOpacity,
              }}
            >
              <Text
                fontSize="sm"
                color="white"
                textAlign="center"
                fontFamily="Inter-Regular"
                opacity={0.7}
                mt={4}
              >
                Tap to continue to your secure banking experience
              </Text>
            </Animated.View>
          )}
        </VStack>
      </Center>
    </Box>
  );
};

export default IntroScreen;