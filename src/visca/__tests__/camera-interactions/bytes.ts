export function ACK(y: number): [number, number, number] {
	if (0x0 <= y && y <= 0xf) {
		return [0x90, 0x40 + y, 0xff]
	}

	throw new Error(`Invalid socket number passed to ACK: ${y}`)
}

export function Completion(y: number): [number, number, number] {
	if (0x0 <= y && y <= 0xf) {
		return [0x90, 0x50 + y, 0xff]
	}

	throw new Error(`Invalid socket number passed to Completion: ${y}`)
}

export function ACKCompletion(y: number): [number, number, number, number, number, number] {
	return [...ACK(y), ...Completion(y)]
}

export function CommandNotExecutable(y: number): [number, number, number, number] {
	if (0x0 <= y && y <= 0xf) {
		return [0x90, 0x60 + y, 0x41, 0xff]
	}

	throw new Error(`Invalid socket number passed to CommandNotExecutable: ${y}`)
}

export const CommandBufferFullBytes = [144, 96, 3, 255]
export const SyntaxErrorBytes = [0x90, 0x60, 0x02, 0xff]

export function PresetRecallBytes(preset: number): [number, number, number, number, number, number, number] {
	if (!(0 <= preset && preset <= 255)) {
		throw new Error(`Invalid preset number: ${preset}`)
	}
	return [0x81, 0x01, 0x04, 0x3f, 0x02, preset, 0xff]
}

export const CameraPowerBytes = [0x81, 0x01, 0x04, 0x00, 0x02, 0xff]
export const ExposureModeInquiryBytes = [0x81, 0x09, 0x04, 0x39, 0xff]
export const FocusFarStandardBytes = [0x81, 0x01, 0x04, 0x08, 0x02, 0xff]
export const FocusModeInquiryBytes = [129, 9, 4, 56, 255]
export const FocusNearStandardBytes = [0x81, 0x01, 0x04, 0x08, 0x03, 0xff]
export const FocusStopBytes = [0x81, 0x01, 0x04, 0x08, 0x00, 0xff]
export const FocusLockBytes = [0x81, 0x0a, 0x04, 0x68, 0x02, 0xff]
export const OnScreenDisplayCloseBytes = [0x81, 0x01, 0x06, 0x06, 0x03, 0xff]
export const OnScreenDisplayInquiryBytes = [0x81, 0x09, 0x06, 0x06, 0xff]
export const OnScreenDisplayToggleBytes = [0x81, 0x01, 0x04, 0x3f, 0x02, 0x5f, 0xff]
export const PanTiltHomeBytes = [0x81, 0x01, 0x06, 0x04, 0xff]
