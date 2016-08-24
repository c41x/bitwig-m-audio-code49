loadAPI(1);

host.defineController("M-Audio", "Code 49", "1.0", "d977f794-009f-41da-9c10-b3262bc9a712");
host.defineMidiPorts(1, 0);

var LOWEST_CC = 1;
var HIGHEST_CC = 119;

var DEVICE_START_CC = 20;
var DEVICE_END_CC = 27;

// all transport buttons available for m-audio code series
var TRANSPORT = {
    REW : 91,
    FF : 92,
    STOP : 93,
    PLAY : 94,
    RECORD : 95
};

function init() {
    host.getMidiInPort(0).setMidiCallback(onMidi);
    host.getMidiInPort(0).setSysexCallback(onSysex);
    generic = host.getMidiInPort(0).createNoteInput("", "??????");
    generic.setShouldConsumeEvents(false);

    transport = host.createTransport();

    // Map CC 20 - 27 to device parameters
    cursorDevice = host.createCursorDeviceSection(8);
    cursorTrack = host.createCursorTrackSection(3, 0);
    primaryInstrument = cursorTrack.getPrimaryInstrument();

    for (var i = 0; i < 8; i++) {
	var p = primaryInstrument.getMacro(i).getAmount();
	p.setIndication(true);
    }

    // Make the rest freely mappable
    userControls = host.createUserControlsSection(HIGHEST_CC - LOWEST_CC + 1 - 8);

    for (var i = LOWEST_CC; i < HIGHEST_CC; i++) {
	if (!isInDeviceParametersRange(i)) {
	    var index = userIndexFromCC(i);
	    userControls.getControl(index).setLabel("CC" + i);
	}
    }
}

function isInDeviceParametersRange(cc) {
    return cc >= DEVICE_START_CC && cc <= DEVICE_END_CC;
}

function userIndexFromCC(cc) {
    if (cc > DEVICE_END_CC) {
	return cc - LOWEST_CC - 8;
    }

    return cc - LOWEST_CC;
}

function onMidi(status, data1, data2) {
    if (isChannelController(status)) {
	if (isInDeviceParametersRange(data1)) {
	    var index = data1 - DEVICE_START_CC;
	    primaryInstrument.getMacro(index).getAmount().set(data2, 128);
	}
	else if (data1 >= LOWEST_CC && data1 <= HIGHEST_CC) {
	    var index = data1 - LOWEST_CC;
	    userControls.getControl(index).set(data2, 128);
	}
    }

    // m-audio code series uses mackie/hui for transport buttons
    if (isNoteOn(status)) {
	if (data2 > 0) { // on key press
	    switch (data1) {
	    case TRANSPORT.PLAY:
		transport.play();
		break;
	    case TRANSPORT.STOP:
		transport.stop();
		break;
	    case TRANSPORT.RECORD:
		transport.record();
		break;
	    case TRANSPORT.REW:
                transport.rewind();
		break;
	    case TRANSPORT.FF:
                transport.fastForward();
		break;
            }
	}
    }
}

function onSysex(data) {
    // MMC Transport Controls:
    switch (data) {
    case "f07f7f0605f7":
        transport.rewind();
        break;
    case "f07f7f0604f7":
        transport.fastForward();
        break;
    case "f07f7f0601f7":
        transport.stop();
        break;
    case "f07f7f0602f7":
        transport.play();
        break;
    case "f07f7f0606f7":
        transport.record();
        break;
    }
}

function exit() {}
