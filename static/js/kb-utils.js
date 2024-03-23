(function (window) {
    const MAIN_IMAGE_TAG = 'image-tag:object:photo';
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

                if (tags.includes(MAIN_IMAGE_TAG)) {
                    return image;
                }
            }

            return item.images[0];
        },

        getImageMediumSrc: function (image) {
            return MEDIA_MEDIUM_STORAGE_URL + image.file;
        },

        getItemSourceFileUrl: function (item) {
            const sourceFilePath = [
                item.belongsTo.region.split('-')[1],
                item.belongsTo.subregion.split('-')[1],
                item.id + '.yaml'
            ].join('/');

            return SOURCE_FILE_BASE_URL + sourceFilePath;
        },
    };
})(window);
