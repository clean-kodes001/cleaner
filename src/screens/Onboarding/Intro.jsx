import React, {useCallback, useRef, useState} from 'react';
import {
  Dimensions,
  StyleSheet,
  View,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Image,
} from 'react-native';
import Icon from "@react-native-vector-icons/material-design-icons";
import Text from '../../components/Shared/Text';
import {SwiperFlatList} from 'react-native-swiper-flatlist';

import ScreenContainer from '../../components/Shared/ScreenContainer';

import image from '../../assets/media/logo/swipekin-logo.png';
import Button from '../../components/Shared/Button';
import {colors} from '../../config/colors';
import {useDispatch} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {completeOnboarding} from '../../store/reducer/userSlice';

const Intro = ({navigation}) => {
  const {t} = useTranslation();
  const slider1 = useRef(null);
  const dispatch = useDispatch();
  const [currInd, setCurrInd] = useState(null);
  const handleGoBack = () => {
    const index = slider1.current.getCurrentIndex();
    if (index > 0) {
      slider1.current.scrollToIndex({index: index - 1, animated: true});
    }
  };
  const handleSkip = () => {
    const index = slider1.current.getCurrentIndex();
    if (index < items.length - 1) {
      slider1.current.scrollToIndex({index: index + 1, animated: true});
    }
  };
  const handleNext = () => {
    dispatch(completeOnboarding());
    navigation.replace('welcome');
  };

  const items = [
    {
      image: image,
      text: t('intro.next_job_starts_here'),
    },
    // {
    //   icon: <Icon name="bike-fast" size={200} color={'#382e97'} />,
    //   text: 'Request a cleaner now.',
    // },
  ];
  const indexChanged = ({index}) => {
    setCurrInd(index);
  };
  return (
    <SwiperFlatList
      ref={slider1}
      onChangeIndex={indexChanged}
      autoplay
      autoplayDelay={3}
      autoplayLoop
      on
      autoplayLoopKeepAnimation
      showPagination
      paginationDefaultColor="#BDBDBD"
      paginationActiveColor="#5143d9"
      paginationStyleItem={{
        // width: 52,
        // height: 4,
        // borderRadius: 2,
        // marginRight: 0,
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 0,
      }}
      paginationStyle={{
        position: 'absolute',
        bottom: '2%',
      }}
      data={items}
      renderItem={({item, index}) => (
        <View>
          <StatusBar hidden={true} />

          <View style={styles.main}>
            <View style={styles.child}>
              <View style={styles.inner}>
                {item.icon ? (
                  item.icon
                ) : (
                  <Image
                    style={{
                      width: 200,
                      height: 200,
                      borderRadius: 20,
                      marginBottom: 12,
                    }}
                    source={item.image}
                  />
                )}

                <Text
                  center
                  capitalized
                  bold
                  fontType={'roboto'}
                  // color={'#5143d9'}
                  color={'#28216c'}
                  // color={'#fff'}
                  style={styles.text}>
                  {item.text}
                </Text>
                <View style={styles.btmBtns}>
                  {index === items.length - 1 ? (
                    <Button
                      pressed={handleNext}
                      variant="outline"
                      text={t('onboarding.get_started')}
                      // endAdornment={'arrow-Right'}
                      mt={0}
                      height={56}
                      style={{borderColor: '#fff', width: '100%'}}
                    />
                  ) : (
                    <TouchableOpacity onPress={handleSkip} style={styles.next}>
                      <Icon name="chevron-right" color={'#fff'} size={30} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>
      )}
    />
  );
};

export default Intro;

const {width} = Dimensions.get('window');
const styles = StyleSheet.create({
  main: {
    flex: 1,
    // backgroundColor: '#fff',
    backgroundColor: '#dcd9f7',
    // backgroundColor: '#edecfb',
  },
  text: {
    fontSize: 26,
    maxWidth: '90%',
    lineHeight: 32,
    letterSpacing: -0.1,
    fontWeight: '600',
  },

  image: {
    width: '100%',
    height: '100%',
    filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25))',
  },

  btmBtns: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  next: {
    alignSelf: 'flex-end',
    height: 48,
    width: 48,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#5143d9',
    borderRadius: 24,
  },
  child: {
    width,
    flex: 1,

    marginTop: 20,

    marginBottom: 28,
    paddingLeft: 28,
    paddingRight: 22,

    justifyContent: 'flex-end',
  },
  inner: {
    alignItems: 'center',
    height: '65%',
    width: '100%',
    justifyContent: 'space-between',
  },
});
