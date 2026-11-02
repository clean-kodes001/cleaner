// import React, {useRef, useState} from 'react';
// import {StyleSheet, View, TouchableOpacity, ActivityIndicator} from 'react-native';
// import Video, {VideoRef} from 'react-native-video';
// import Icons from '@react-native-vector-icons/material-design-icons';
// import Icons2 from '@react-native-vector-icons/material-icons';
// import Text from './Text';
// import {colors} from '../../config/colors';
// import {showToast} from '../../utils/showToast';

// const VideoPlayer = ({url = '', onFinish}) => {
//   const videoRef = useRef(null);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [isRemaining, setIsRemaining] = useState(0);
//   const [duration, setDuration] = useState(0); // Store actual duration for Android where seekableDuration is buggy
//   const [isCompleted, setIsCompleted] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isBuffering, setIsBuffering] = useState(false);
//   const [hasStartedPlaying, setHasStartedPlaying] = useState(false);

//   return (
//     <View>
//       <View style={{height: 350, width: '100%', position: 'relative', backgroundColor: '#000'}}>
//         <Video
//           ref={videoRef}
//           // Can be a URL or a local file.
//           source={{uri: url}}
//           // controls={true}
//           resizeMode="contain"
//           paused={!isPlaying}
//           onLoad={data => {
//             setDuration(data.duration);
//             setIsRemaining(data.duration);
//           }}
//           onProgress={p => {
//             const vidDuration = duration > 0 ? duration : (p.seekableDuration ?? 0);
//             setIsRemaining(vidDuration - (p.currentTime ?? 0));
//             if (isBuffering) setIsBuffering(false); // Clear buffering if making progress
//           }}
//           onBuffer={({isBuffering: bufferingState}) => {
//             setIsBuffering(bufferingState);
//           }}
//           // Callback when video cannot be loaded
//           onError={e => {
//             console.log('Video Player Error:', e);
//             setIsPlaying(false);
//             showToast({
//               type: 0,
//               message: 'Video playback error: ' + (e?.error?.errorString || e?.error?.message || 'Unsupported or network failure'),
//             });
//           }}
//           onEnd={() => {
//             setIsCompleted(true);
//             setIsPlaying(false);
//           }}
//           style={styles.backgroundVideo}
//         />

//         {/* Buffering Indicator Overlay */}
//         {isBuffering && isPlaying && (
//           <View style={StyleSheet.absoluteFillObject}>
//             <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center'}}>
//               <ActivityIndicator size="large" color="#ffffff" />
//               <Text style={{color: '#fff', marginTop: 10}}>{t('common.buffering_video')}</Text>
//             </View>
//           </View>
//         )}
//       </View>

//       <TouchableOpacity
//         onPress={() => {
//           const willPlay = !isPlaying;
//           setIsPlaying(willPlay);

//           // Android Samsung ExoPlayer Hack:
//           // Sometimes it gets stuck on the first frame and refuses to decode until forced.
//           // By seeking a tiny amount forward, we kick the hardware decoder into action.
//           if (willPlay && !hasStartedPlaying && videoRef.current) {
//             setHasStartedPlaying(true);
//             videoRef.current.seek(0.1);
//           }
//         }}
//         style={[styles.iconContianer, {width: '100%'}]}>
//         <Text
//           center
//           bold
//           style={{
//             fontSize: 20,
//             color: colors.fadedText,
//             width: '20%',
//             marginTop: 6,
//           }}>
//           {!isPlaying ? t('common.play') : t('common.pause')}
//         </Text>
//         <View style={{width: '10%', marginTop: 6}}>
//           <Icons color="#fff" size={30} name={!isPlaying ? 'play' : 'pause'} />
//         </View>
//         <Text
//           center
//           bold
//           style={{
//             fontSize: 20,
//             color: colors.fadedText,
//             width: '70%',
//             marginTop: 6,
//           }}>
//           Remaining{' '}
//           {Math.floor(isRemaining) > 60
//             ? `${Math.floor(isRemaining / 60)} mins`
//             : `${Math.floor(isRemaining > 0 ? isRemaining : 0)} secs`}
//           ...
//         </Text>
//       </TouchableOpacity>

//       {isRemaining <= 0 && isCompleted && (
//         <TouchableOpacity
//           disabled={isLoading}
//           onPress={() => {
//             setIsLoading(true);
//             onFinish();
//           }}
//           style={{
//             width: '100%',
//             height: 50,
//             marginTop: 10,
//             backgroundColor: isLoading ? '#7a70e0' : '#5143d9',
//             borderRadius: 50,
//             justifyContent: 'center',
//             alignItems: 'center',
//             opacity: isLoading ? 0.7 : 1,
//           }}>
//           {isLoading ? (
//             <ActivityIndicator size="small" color={colors.active} />
//           ) : (
//             <Text
//               center
//               bold
//               style={{
//                 fontSize: 18,
//                 color: colors.active,
//               }}>
//               Continue
//             </Text>
//           )}
//         </TouchableOpacity>
//       )}
//     </View>
//   );
// };

// export default VideoPlayer;

// var styles = StyleSheet.create({
//   backgroundVideo: {
//     position: 'relative',
//     // top: 0,
//     // left: 0,
//     // bottom: 0,
//     // right: 0,
//     width: '100%',
//     height: '100%',
//   },
//   iconContianer: {
//     flexDirection: 'row',
//     backgroundColor: '#5143d9',
//     justifyContent: 'center',
//     alignItems: 'left',
//     width: '100%',
//     height: 45,
//     color: 'white',
//     borderRadius: 50,
//     marginTop: -22,
//     paddingLeft: 15,
//   },
// });

import React, {useRef, useState} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Video, {VideoRef} from 'react-native-video';
import Icons from '@react-native-vector-icons/material-design-icons';
import Icons2 from '@react-native-vector-icons/material-icons';
import Text from './Text';
import {colors} from '../../config/colors';
import {useTranslation} from 'react-i18next';

const VideoPlayer = ({url = '', onFinish}) => {
  const {t} = useTranslation();
  // const videoRef = useRef<VideoRef>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRemaining, setIsRemaining] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <View>
      <View style={{height: 350, width: '100%'}}>
        <Video
          // Can be a URL or a local file.
          source={{uri: url}}
          // controls={true}
          resizeMode="contain"
          paused={!isPlaying}
          onProgress={p =>
            setIsRemaining((p.seekableDuration ?? 0) - (p.currentTime ?? 0))
          }
          // Store reference
          // ref={videoRef}
          // Callback when remote video is buffering
          // onBuffer={() => console.log('onBuffer')}
          // Callback when video cannot be loaded
          // onError={() => console.log('onError')}
          onEnd={() => {
            setIsCompleted(true);
          }}
          style={styles.backgroundVideo}
        />
      </View>

      <TouchableOpacity
        onPress={() => setIsPlaying(p => !p)}
        style={[styles.iconContianer, {width: '100%'}]}>
        <Text
          center
          bold
          style={{
            fontSize: 20,
            color: colors.fadedText,
            width: '20%',
            marginTop: 6,
          }}>
          {!isPlaying ? t('common.play') : t('common.pause')}
        </Text>
        <View style={{width: '10%', marginTop: 6}}>
          <Icons color="#fff" size={30} name={!isPlaying ? 'play' : 'pause'} />
        </View>
        <Text
          center
          bold
          style={{
            fontSize: 20,
            color: colors.fadedText,
            width: '70%',
            marginTop: 6,
          }}>
          Remaining{' '}
          {Math.floor(isRemaining) > 60
            ? `${Math.floor(isRemaining / 60)} mins`
            : `${Math.floor(isRemaining > 0 ? isRemaining : 0)} secs`}
          ...
        </Text>
      </TouchableOpacity>

      {isRemaining <= 0 && isCompleted && (
        <TouchableOpacity
          disabled={isLoading}
          onPress={() => {
            setIsLoading(true);
            onFinish();
          }}
          style={{
            width: '100%',
            height: 50,
            marginTop: 10,
            backgroundColor: isLoading ? '#7a70e0' : '#5143d9',
            borderRadius: 50,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: isLoading ? 0.7 : 1,
          }}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.active} />
          ) : (
            <Text
              center
              bold
              style={{
                fontSize: 18,
                color: colors.active,
              }}>
              {t('common.continue')}
            </Text>
          )}
        </TouchableOpacity>
      )}
      {/* <TouchableOpacity
        disabled={isLoading}
        onPress={() => {
          setIsLoading(true);
          onFinish();
        }}
        style={{
          width: '100%',
          height: 50,
          marginTop: 10,
          backgroundColor: isLoading ? '#7a70e0' : '#5143d9',
          borderRadius: 50,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: isLoading ? 0.7 : 1,
        }}>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.active} />
        ) : (
          <Text
            center
            bold
            style={{
              fontSize: 18,
              color: colors.active,
            }}>{t('common.skip')}</Text>
        )}
      </TouchableOpacity> */}
    </View>
  );
};

export default VideoPlayer;

var styles = StyleSheet.create({
  backgroundVideo: {
    position: 'relative',
    // top: 0,
    // left: 0,
    // bottom: 0,
    // right: 0,
    width: '100%',
    height: '100%',
  },
  iconContianer: {
    flexDirection: 'row',
    backgroundColor: '#5143d9',
    justifyContent: 'center',
    alignItems: 'left',
    width: '100%',
    height: 45,
    color: 'white',
    borderRadius: 50,
    marginTop: -22,
    paddingLeft: 15,
  },
});
