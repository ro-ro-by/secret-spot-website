(function (window) {
    const MAIN_IMAGE_TAGS = [
        'image-tag:object:photo',
        'image-tag:object:overview',
    ];
    const MEDIA_MEDIUM_STORAGE_URL = 'https://media.secret-spot-by.com/medium/';
    const SOURCE_FILE_BASE_URL = 'https://github.com/ro-ro-by/secret-spot-kb/blob/master/';

    window.kbUtils = {
        getItemMainImage: function (item) {
            if (!item.images) {
                return undefined;
            }

            for (let i = 0; i < item.images.length; i++) {
                const image = item.images[i];
                const tags = image.tags || [];

                if (tags.filter(tag => MAIN_IMAGE_TAGS.includes(tag)).length) {
                    return image;
                }
            }

            return item.images[0];
        },

        getImageMediumSrc: function (image) {
            return MEDIA_MEDIUM_STORAGE_URL + image.file;
        },

        getItemSourceFileUrl: function (item) {
            return SOURCE_FILE_BASE_URL + item['__system__'].source;
        },
    };
})(window);
