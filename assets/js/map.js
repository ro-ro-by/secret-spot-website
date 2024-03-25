(function (window) {
    const MAP_LOADER_CLASS = 'spinner';
    const VECTOR_FEATURE_TYPE_COLOR_DEFAULT = 'gray';
    const VECTOR_FEATURE_TYPE_COLOR = {
        'spring': 'blue',
        'tree': 'orange',
        'boulder': 'red'
    };

    /**
     * Add event listener on feature click.
     */
    function onFeatureClick(map, layer, callback) {
        map.on('click', (e) => {
            layer.getFeatures(e.pixel)
                .then(function (features) {
                    callback(e, features[0] ?? null);
                });
        });
    }

    /**
     * Change cursor on feature hover.
     */
    function initCursorPointerOnFeatureHover(map) {
        map.on('pointermove', (e) => {
            const mapContainer = map.getTargetElement();
            const pixel = map.getEventPixel(e.originalEvent);
            const hit = map.hasFeatureAtPixel(pixel);

            mapContainer.style.cursor =  hit ? 'pointer' : '';
        });
    }

    /**
     * Add spinner on map loading.
     */
    function initSpinnerOnLoadingData(map) {
        map.on('loadstart', function () {
            map.getTargetElement().classList.add(MAP_LOADER_CLASS);
        });

        map.on('loadend', function () {
            map.getTargetElement().classList.remove(MAP_LOADER_CLASS);
        });
    }

    function buildFeatureInfoHtml(kb, feature) {
        const id = feature.get('id');
        const item = kb.getItemById(id);
        const image = kbUtils.getItemMainImage(item);
        const sourceFileUrl = kbUtils.getItemSourceFileUrl(item);

        const lines = [];

        lines.push(`<p><strong>${item.title}</strong></p>`)
        lines.push(`<p>[${item.id}]</p>`)

        if (image) {
            lines.push(`<div>
                <div class="item-image">
                    <img alt="${item.title}" src="${kbUtils.getImageMediumSrc(image)}"/>
                </div>
                <p>${image.meta?.author || ''} ${image.meta?.version ? '(' + image.meta?.version + ')' : ''}</p>
            </div>`);
        }

        const sources = item.meta?.source || [];
        sources
            .filter(source => source.type === 'web')
            .forEach(source => {
                lines.push(`<p><a title="source" target="_blank" href="${source.web?.url}">${source.web?.url}</a></p>`)
            });

        lines.push(`<p><a title="github" target="_blank" href="${sourceFileUrl}">[🙊] Secret Spot GitHub</a></p>`)

        return `<div>${lines.join('')}</div>`;
    }

    /**
     *
     * @param {HTMLElement} container
     */
    function buildPopup(container) {
        const popupEl = document.createElement('div');
        popupEl.className = 'ol-popup';

        const closerEl = document.createElement('a')
        closerEl.className = 'ol-popup-closer';
        closerEl.href = '#';

        const contentEl = document.createElement('div');
        contentEl.className = 'ol-popup-content';

        popupEl.append(closerEl, contentEl);
        container.append(popupEl);

        /**
         * Create an overlay to anchor the popup to the map.
         */
        const overlay = new ol.Overlay({
            element: popupEl,
            autoPan: {
                animation: {
                    duration: 250,
                },
            },
        });

        const close = () => {
            overlay.setPosition(undefined);
            closerEl.blur();
        }

        /**
         * Add a click handler to hide the popup.
         * @return {boolean} Don't follow the href.
         */
        closerEl.onclick = function () {
            close();
            return false;
        };

        return {
            overlay,
            close,
            show(position, content) {
                contentEl.innerHTML = content;
                overlay.setPosition(position);
            }
        };
    }

    function buildGeometryLayerStyle(feature) {
        const type = feature.get('type');
        const color = VECTOR_FEATURE_TYPE_COLOR[type] || VECTOR_FEATURE_TYPE_COLOR_DEFAULT;

        return buildGeometryLayerStyleByColor(color);
    }

    function buildGeometryLayerStyleByColor(color) {
        return new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(0, 128, 0, 0.2)',
            }),
            stroke: new ol.style.Stroke({
                color: 'rgba(0, 0, 0, 0.5)',
            }),
            image:  new ol.style.Circle({
                radius: 5,
                fill: new ol.style.Fill({
                    color,
                }),
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 0, 0.5)',
                    width: 2
                }),
            }),
        });
    }

    function buildTitleLayerStyle(feature) {
        const title = feature.get('title');
        const shortId = feature.get('short_id');

        const label = `${title}\n[${shortId}]`;

        return new ol.style.Style({
            text: new ol.style.Text({
                text: label,
                textAlign: 'center',
                fill: new ol.style.Fill({
                    color: 'rgba(0, 0, 0)'
                }),
                stroke: new ol.style.Stroke({
                    color: 'rgba(128, 128, 128)',
                    width: 1
                }),
                scale: 1.2,
                offsetX: 0,
                offsetY: -20
            }),
        });
    }

    /**
     * Build map to container.
     *
     * @param {HTMLElement} container
     * @returns {ol.Map}
     */
    function buildMap(container) {
        const popup = buildPopup(container.parentElement);

        const osmLayer = new ol.layer.Tile({
            className: 'ol-osm-layer',
            source: new ol.source.OSM(),
        });

        const rasterLayer = new ol.layer.Tile({
            source: new ol.source.XYZ({
                attributions: '© SecretSpot',
                url: 'https://tiles.secret-spot-by.com/latest/raster/base/{z}/{x}/{y}.png',
                maxZoom: 14,
            }),
        });

        const vectorSource = new ol.source.VectorTile({
            attributions: '© SecretSpot',
            format: new ol.format.MVT(),
            url: 'https://tiles.secret-spot-by.com/latest/vector/base/{z}/{x}/{y}.pbf',
            maxZoom: 9,
        });

        const vectorObjectsLayer = new ol.layer.VectorTile({
            declutter: false,
            source: vectorSource,
            style: buildGeometryLayerStyle,
        });

        const vectorLabelLayer = new ol.layer.VectorTile({
            declutter: true,
            source: vectorSource,
            style: buildTitleLayerStyle,
        });

        const map = new ol.Map({
            controls: ol.control.defaults.defaults().extend([new ol.control.FullScreen()]),
            layers: [
                osmLayer,
                rasterLayer,
                vectorObjectsLayer,
                vectorLabelLayer,
            ],
            overlays: [
                popup.overlay,
            ],
            target: container,
            view: new ol.View({
                center: ol.proj.fromLonLat([27.95, 53.70]),
                zoom: 6,
            }),
        });

        const onResolutionChange = (map) => {
            const isLowResolution = map.getView().getResolution() < 50;

            rasterLayer.setVisible(!isLowResolution);
            vectorObjectsLayer.setVisible(isLowResolution);
            vectorLabelLayer.setVisible(isLowResolution);
        };

        map.getView().on('change:resolution', () => onResolutionChange(map));

        onResolutionChange(map);

        initCursorPointerOnFeatureHover(map);
        initSpinnerOnLoadingData(map);

        const kb = initKbInstance(KB_SOURCE);
        onFeatureClick(map, vectorObjectsLayer, (event, feature) => {
            if (!feature) {
                popup.close();
                return;
            }

            popup.show(event.coordinate, buildFeatureInfoHtml(kb, feature));
        });

        return map;
    }

    window.SecretSpotMap = {
        buildMap,
    };
})(window);
