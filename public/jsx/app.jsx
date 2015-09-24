'use strict'

var socket = null;

function startSocket () {
    socket	= io(window.location.hostname + ':3000');
}

function loadMap (currentPosition) {
    $.getJSON('/api/coords', function (coords) {
        console.log('coords: ', coords)
        $("#gmap").gMap({
        	controls: false,
        	scrollwheel: true,
        	markers: coords,
        	latitude: currentPosition.latitude,
        	longitude: currentPosition.longitude,
        	zoom: 16
        });
    }).fail(handleError);
}

function handleError (err) {
    console.log(err);
}

function getLocation (callback, errorCallback) {
    navigator.geolocation.getCurrentPosition(function (position) {
        var args = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }

        callback(args);
    },
        errorCallback,
        {maximumAge: 75000, enableHighAccuracy: true}
    );
}

var RealTimeMap = React.createClass({
    componentDidMount: function() {
        getLocation(loadMap, handleError);
        startSocket();
        socket.on('added', function (data) {
			loadMap(data);
		});
    },
    render: function () {
        return (
            <article>
                <div id="gmap"></div>
                <div id="button-div">
                    <LocationButton />
                </div>
            </article>
        );
    }
});

var LocationButton = React.createClass({
    sendNewCoords: function (position) {
        var data = {
            latitude: position.latitude,
            longitude: position.longitude
        };

        $.ajax({
            url:'/api/coords',
            method: 'POST',
            dataType: 'json',
            data: {coords: data}
        }).done(function (res) {
            console.log(res)
            loadMap(position);
        }).fail(handleError);
    },
    render: function () {
        return (
            <button onClick={getLocation.bind(null, this.sendNewCoords, handleError)}>
                Mi ubicación
            </button>
        );
    }
});

React.render(<RealTimeMap />, document.querySelector('#gmap-section'));
