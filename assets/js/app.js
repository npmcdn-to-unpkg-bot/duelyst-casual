// open websocket
var ws = new WebSocket("ws://" + window.location.host + "/ws");

// register modal component
Vue.component('modal', {
    template: '#modal-template',
    props: {
        show: {
            type: Boolean,
            required: true,
            twoWay: true
        }
    }
});

// init app
var app = new Vue({
    el: "#container",
    data: {
        showModal: false,
        current: null,
        creator: null,
        faction: null,
        description: null,
        accepted: null,
        items: []
    },
    methods: {
        receive: function (item) {
            var items = this.items;

            if (!item.old_val && item.new_val) {
                // add item
                items.push(item.new_val);
            } else if (item.old_val && !item.new_val) {
                // rm item
                var id = item.old_val.id;
                items = _.remove(items, function (o) {
                    return o.id != id;
                });
            } else if (JSON.stringify(item.old_val) != JSON.stringify(item.new_val)) {
                // update item
                var index = _.indexOf(items, _.find(items, item.old_val));
                items.splice(index, 1, item.new_val);
            }

            items = _(items)
                .uniqBy(function (e) {
                    return e.id;
                })
                .map(function (e) {
                    // update timestamps
                    e.timestamp_h = moment(e.timestamp).fromNow();
                    return e;
                })
                .sortBy(function (e) {
                    return e.timestamp;
                })
                .reverse()
                .value();

            this.$set('items', items);
        },
        post: function (e) {
            e.preventDefault();
            ws.send(JSON.stringify({
                creator: this.creator,
                faction: this.faction,
                description: this.description,
                accepted: (this.accepted === 1)
            }));
        },
        accept: function (index) {
            var item = this.items[index];
            this.current = item;
            this.showModal = true;
            ws.send(JSON.stringify({
                id: item.id
            }));
        },
    }
});

// init websocket
ws.onmessage = function (e) {
    var data = JSON.parse(e.data);
    if (data) {
        app.receive(data);
    }
};

ws.onopen = function (e) {
    console.log("Connected");
};

ws.onclose = function (e) {
    console.log("Disconnected");
};

ws.onerror = function (e) {
    console.log(e);
    alert("A wild error appeared! please refresh your browser");
};