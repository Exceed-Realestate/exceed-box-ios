import ExpoModulesCore
import UIKit
import Vision

/// On-device text recognition (`VNRecognizeTextRequest`) for business-card scanning.
///
/// Deliberately Japanese-first: `recognitionLanguages = ["ja-JP", "en-US"]` — Vision
/// biases to English when this isn't set explicitly, and the primary users are the
/// Tokyo office. Every recognized line is returned with its confidence and a
/// normalized, top-left-origin bounding box so the JS-side field guesser has geometry
/// to work with, not just a flat text blob.
public class ExpoTextRecognitionModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoTextRecognition")

    // Runs on ExpoModulesCore's default background queue for AsyncFunctions, so the
    // (potentially slow, "accurate" mode) Vision request never blocks the JS thread.
    AsyncFunction("recognizeText") { (uri: String) throws -> [[String: Any]] in
      try ExpoTextRecognitionModule.performRecognition(uriString: uri)
    }

    Function("isAvailable") { () -> Bool in
      true
    }
  }

  private static func performRecognition(uriString: String) throws -> [[String: Any]] {
    guard let url = resolveURL(from: uriString) else {
      throw TextRecognitionError.invalidURI(uriString)
    }
    guard let data = try? Data(contentsOf: url) else {
      throw TextRecognitionError.unreadableImage(uriString)
    }
    guard let image = UIImage(data: data), let cgImage = image.cgImage else {
      throw TextRecognitionError.unreadableImage(uriString)
    }

    let orientation = CGImagePropertyOrientation(image.imageOrientation)

    var blocks: [[String: Any]] = []
    var requestError: Error?

    let request = VNRecognizeTextRequest { request, error in
      if let error {
        requestError = error
        return
      }
      guard let observations = request.results as? [VNRecognizedTextObservation] else { return }

      for observation in observations {
        guard let candidate = observation.topCandidates(1).first else { continue }

        // Vision's boundingBox is normalized with origin at the BOTTOM-LEFT of the
        // image. Flip to top-left origin so JS callers never have to think about
        // Vision's convention (matches how every other platform text layout API
        // reports geometry).
        let box = observation.boundingBox
        let x = Double(box.origin.x)
        let y = Double(1 - box.origin.y - box.height)
        let w = Double(box.width)
        let h = Double(box.height)

        blocks.append([
          "text": candidate.string,
          "confidence": Double(candidate.confidence),
          "box": ["x": x, "y": y, "w": w, "h": h],
        ])
      }
    }

    // Per the research doc (Apple's own recognizeText docs): accurate recognition,
    // Japanese prioritized ahead of English, with language correction on.
    request.recognitionLevel = .accurate
    request.recognitionLanguages = ["ja-JP", "en-US"]
    request.usesLanguageCorrection = true

    let handler = VNImageRequestHandler(cgImage: cgImage, orientation: orientation, options: [:])
    do {
      try handler.perform([request])
    } catch {
      throw TextRecognitionError.visionRequestFailed(error.localizedDescription)
    }

    if let requestError {
      throw TextRecognitionError.visionRequestFailed(requestError.localizedDescription)
    }

    // Top-to-bottom, then left-to-right — matches natural reading order for a card
    // whose lines the OCR engine may not otherwise return in visual order.
    blocks.sort { a, b in
      let aBox = a["box"] as! [String: Double]
      let bBox = b["box"] as! [String: Double]
      if abs(aBox["y"]! - bBox["y"]!) > 0.01 {
        return aBox["y"]! < bBox["y"]!
      }
      return aBox["x"]! < bBox["x"]!
    }

    return blocks
  }

  /// Accepts `file://…` URIs (the normal shape from `expo-image-picker`/`expo-file-system`),
  /// bare absolute paths, and other URL-schemed strings.
  private static func resolveURL(from uriString: String) -> URL? {
    if let url = URL(string: uriString), url.scheme != nil {
      return url
    }
    if FileManager.default.fileExists(atPath: uriString) {
      return URL(fileURLWithPath: uriString)
    }
    return nil
  }
}

private enum TextRecognitionError: Error, CustomNSError {
  case invalidURI(String)
  case unreadableImage(String)
  case visionRequestFailed(String)

  static var errorDomain: String { "ExpoTextRecognition" }

  var errorCode: Int {
    switch self {
    case .invalidURI: return 1
    case .unreadableImage: return 2
    case .visionRequestFailed: return 3
    }
  }

  var errorUserInfo: [String: Any] {
    switch self {
    case .invalidURI(let uri):
      return [NSLocalizedDescriptionKey: "Could not resolve a URL from uri: \(uri)"]
    case .unreadableImage(let uri):
      return [NSLocalizedDescriptionKey: "Could not decode image data at uri: \(uri)"]
    case .visionRequestFailed(let message):
      return [NSLocalizedDescriptionKey: "Vision text recognition failed: \(message)"]
    }
  }
}

private extension CGImagePropertyOrientation {
  /// Vision needs `CGImagePropertyOrientation`, not `UIImage.Orientation` — this is
  /// Apple's own documented mapping between the two.
  init(_ uiOrientation: UIImage.Orientation) {
    switch uiOrientation {
    case .up: self = .up
    case .upMirrored: self = .upMirrored
    case .down: self = .down
    case .downMirrored: self = .downMirrored
    case .left: self = .left
    case .leftMirrored: self = .leftMirrored
    case .right: self = .right
    case .rightMirrored: self = .rightMirrored
    @unknown default: self = .up
    }
  }
}
