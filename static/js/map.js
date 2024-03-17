(function (window, ol) {

    /**
     * Add event listener on feature click.
     */
    function onFeatureClick(map, layer, callback) {
        map.on('click', (e) => {
            layer.getFeatures(e.pixel)
                .then(function (features) {
                    const feature = features[0] ?? null;

                    if (!feature) {
                        return;
                    }

                    callback(feature);
                });
        });
    }

    function cursorPointerOnFeatureHover(map) {
        map.on('pointermove', (e) => {
            const mapContainer = map.getTargetElement();
            const pixel = map.getEventPixel(e.originalEvent);
            const hit = map.hasFeatureAtPixel(pixel);

            mapContainer.style.cursor =  hit ? 'pointer' : '';
        });
    }

    /**
     * Build map to container.
     *
     * @param container
     * @returns {ol.Map}
     */
    function buildMap(container) {
        const osmLayer = new ol.layer.Tile({
            className: 'ol-osm-layer',
            source: new ol.source.OSM(),
        });

        const rasterLayer = new ol.layer.Tile({
            source: new ol.source.XYZ({
                attributions: '© SecretSpot',
                url: 'https://tiles.secret-spot-by.com/raster/{z}/{x}/{y}.png',
                maxZoom: 11,
            }),
        });

        const vectorLayer = new ol.layer.VectorTile({
            declutter: true,
            source: new ol.source.VectorTile({
                attributions: '© SecretSpot',
                format: new ol.format.MVT(),
                url: 'https://tiles.secret-spot-by.com/vector/{z}/{x}/{y}.pbf',
                maxZoom: 9,
            }),
            style: function (feature) {
                const title = `${feature.get('title')}\n[${feature.get('short_id')}]`;
                const type = feature.get('type');

                let color = 'gray';
                switch (type) {
                    case 'spring':
                        color = 'blue';
                        break;
                    case 'tree':
                        color = 'orange';
                        break;
                    case 'boulder':
                        color = 'red';
                        break;
                }

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
                            color: color
                        }),
                        stroke: new ol.style.Stroke({
                            color: 'rgba(0, 0, 0, 0.5)',
                            width: 2
                        }),
                    }),
                    text: new ol.style.Text({
                        text: title,
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
            },
        });

        const map = new ol.Map({
            controls: ol.control.defaults.defaults().extend([new ol.control.FullScreen()]),
            layers: [
                osmLayer,
                rasterLayer,
                vectorLayer,
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
            vectorLayer.setVisible(isLowResolution);
        };

        map.getView().on('change:resolution', () => onResolutionChange(map));
        onFeatureClick(map, vectorLayer, (feature) => {
            const url = `/be/docs/releases/v0_1_0/data/#item-${feature.get('id')}`

            window.location.href = url;
        });
        onResolutionChange(map);
        cursorPointerOnFeatureHover(map);


        return map;
    }

    window.SecretSpotMap = {
        buildMap,
    };
})(window, ol);
