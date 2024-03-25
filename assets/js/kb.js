(function (window) {
    function buildItemsByIdMap(kb) {
        const map = [];

        kb.items.forEach(item => map[item.id] = item);

        return map;
    }

    function initKbInstance(kb) {
        const itemsByIdMap = buildItemsByIdMap(kb);

        return {
            getItemById: function (id) {
                return itemsByIdMap[id];
            }
        }
    }

    window.initKbInstance = initKbInstance;
})(window);
