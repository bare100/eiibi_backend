import React, { useState } from 'react'

const PostAssetsCarousel = ({ record }) => {
  const { assets } = record.params
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!assets || assets.length === 0) {
    return <div>No images available</div>
  }

  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % assets.length)
  }

  const prevImage = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + assets.length) % assets.length
    )
  }

  const currentImage = assets[currentIndex]

  return (
    <div
      style={{
        position: 'relative',
        width: 104,
        height: 50,
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <img
        src={`/assets/${currentImage.path}`}
        alt={`Image ${currentIndex + 1}`}
        style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
      />
      {assets.length > 1 && (
        <button
          onClick={prevImage}
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            transform: 'translateY(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: 25,
            height: 25,
            cursor: 'pointer',
          }}
        >
          &#8249; {/* Left arrow */}
        </button>
      )}
      {assets.length > 1 && (
        <button
          onClick={nextImage}
          style={{
            position: 'absolute',
            top: '50%',
            right: 0,
            transform: 'translateY(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: 25,
            height: 25,
            cursor: 'pointer',
          }}
        >
          &#8250; {/* Right arrow */}
        </button>
      )}
    </div>
  )
}

export default PostAssetsCarousel
