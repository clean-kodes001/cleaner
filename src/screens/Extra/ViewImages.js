import React, {useCallback, useEffect, useMemo, useState} from 'react';
import ImageView from 'react-native-image-viewing';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import {ActivityIndicator, TouchableOpacity, View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {deletePropertyImage} from '../../store/actions/dashboard/deletePropertyImage';

const ViewImages = ({navigation, route}) => {
  const {images, type, startIndex} = route.params;

  const dispatch = useDispatch();

  const {deletingPropertyImage} = useSelector(state => state.user);
  const acceptedCleanRequest = useSelector(
    state => state.user.acceptedCleanRequest,
  );

  const normalizedImages = useMemo(() => {
    const rawImages = Array.isArray(images) ? images : [];

    const normalizeUri = raw => {
      if (!raw || typeof raw !== 'string') return null;
      let uri = raw.trim();
      if (!uri) return null;

      if (uri.startsWith('//')) {
        uri = `https:${uri}`;
      } else if (uri.startsWith('www.')) {
        uri = `https://${uri}`;
      } else if (uri.startsWith('/')) {
        uri = `file://${uri}`;
      }

      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        uri = encodeURI(uri);
      }

      return uri;
    };

    return rawImages
      .map(img => {
        if (typeof img === 'string') {
          const uri = normalizeUri(img);
          return uri ? {uri} : null;
        }

        const uri =
          normalizeUri(img?.uri) ||
          normalizeUri(img?.url) ||
          normalizeUri(img?.link);

        return uri ? {uri} : null;
      })
      .filter(Boolean);
  }, [images]);

  const [currentImage, setCurrentImage] = useState(
    typeof startIndex === 'number' && Number.isFinite(startIndex)
      ? startIndex
      : 0,
  );

  const clampedImageIndex = normalizedImages.length
    ? Math.min(
        Math.max(
          typeof currentImage === 'number' && Number.isFinite(currentImage)
            ? currentImage
            : 0,
          0,
        ),
        normalizedImages.length - 1,
      )
    : 0;

  useEffect(() => {
    if (currentImage !== clampedImageIndex) {
      setCurrentImage(clampedImageIndex);
    }
  }, [clampedImageIndex, currentImage]);

  const handleDeleteImage = useCallback(() => {
    if (!acceptedCleanRequest?.status) return;

    const uriToDelete = normalizedImages?.[clampedImageIndex]?.uri;
    if (!uriToDelete) return;

    const formData = new FormData();
    formData.append('status', acceptedCleanRequest?.status);
    formData.append('images_time', 'start');
    formData.append('images_delete', uriToDelete);

    dispatch(
      deletePropertyImage({
        payload: formData,
        cb: () => {
          navigation.goBack();
        },
      }),
    );
  }, [
    acceptedCleanRequest?.status,
    clampedImageIndex,
    dispatch,
    navigation,
    normalizedImages,
  ]);

  return (
    <ImageView
      images={normalizedImages}
      imageIndex={clampedImageIndex}
      visible={true}
      onImageIndexChange={index => {
        setCurrentImage(index);
      }}
      onRequestClose={() => navigation.goBack()}
      FooterComponent={() => {
        return (
          <View
            style={{
              justifyContent: 'center',
              paddingVertical: 12,
              alignItems: 'center',
            }}>
            {type === 2 ? (
              <TouchableOpacity
                disabled={deletingPropertyImage}
                onPress={() => {
                  handleDeleteImage();
                }}>
                {deletingPropertyImage ? (
                  <ActivityIndicator />
                ) : (
                  <MaterialCommunityIcons
                    color={'#FFF'}
                    name="delete"
                    size={40}
                  />
                )}
              </TouchableOpacity>
            ) : (
              <></>
            )}
          </View>
        );
      }}
    />
  );
};

export default ViewImages;
