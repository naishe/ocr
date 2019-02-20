import React, { Component } from "react";
import "./App.css";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
// import Tesseract from "tesseract.js";
import LoadingOverlay from "react-loading-overlay";

class App extends Component {
  state = {
    src: null,
    crop: {
      // aspect: 1,
      width: 50,
      x: 0,
      y: 0
    },
    fields: {}
  };

  onSelectFile = e => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        this.setState({ src: reader.result })
      );
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  onImageLoaded = (image, pixelCrop) => {
    this.imageRef = image;
  };

  onCropComplete = (crop, pixelCrop) => {
    this.makeClientCrop(crop, pixelCrop);
  };

  makeClientCrop = async (crop, pixelCrop) => {
    if (this.imageRef && crop.width && crop.height) {
      const croppedImageUrl = await this.getCroppedImg(
        this.imageRef,
        pixelCrop,
        "newFile.jpeg"
      );
      this.setState({ croppedImageUrl });
    }
  };

  getCroppedImg = (img, pixelCrop, fileName) => {
    const canvas = document.createElement("canvas");
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      img,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    const croppedImageBase64 = canvas
      .toDataURL("image/png")
      .replace(/^data:image\/(png|jpg);base64,/, "");

    this.setState({ croppedCanvas: canvas, croppedImageBase64 });

    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) {
          console.error("empty canvas");
          return;
        }
        blob.name = fileName;
        window.URL.revokeObjectURL(this.fileUrl);
        this.fileUrl = window.URL.createObjectURL(blob);
        resolve(this.fileUrl);
      }, "image/jpeg");
    });
  };

  onCropChange = crop => this.setState({ crop });

  recognize = async name => {
    const { fields, useGoogleOCR } = this.state;
    const expectedRaw = fields[name];
    console.log("fields", fields);
    const expected = expectedRaw && expectedRaw.trim().toLowerCase();
    this.setState({ isProcessing: true });
    let ocrTxt = "";
    if (useGoogleOCR) {
      ocrTxt = await this.readUsingGoogleOCR();
    } else {
      ocrTxt = await this.readUsingTesseract();
    }

    const txtLower = ocrTxt && ocrTxt.trim().toLowerCase();
    console.log(`xtt: ${txtLower} === ${expected}`);
    this.setState({ txt: ocrTxt, isProcessing: false });
    if (txtLower === expected) {
      window.alert(`✔️ ${name} entered right!`);
    } else {
      window.alert(`❌ ${name} entered wrong!!`);
    }
  };

  setField = (name, event) => {
    const value = event.target.value;
    console.log("name", name);
    console.log("vaslue", value);
    const { fields } = this.state;
    fields[name] = value;
    this.setState({ fields });
  };

  readUsingTesseract = async () => {
    // eslint-disable-next-line
    const readJSON = await Tesseract.recognize(this.state.croppedCanvas);
    return readJSON.text.trim();
  };

  readUsingGoogleOCR = async () => {
    const { croppedImageBase64 } = this.state;
    if (!croppedImageBase64) {
      return "NO IMAGE SELECTED!";
    }

    const key = "AIzaSyBNc4UwRVXbfJ0FK56jvG7uFlPuDZ1T1HQ";
    const body = JSON.stringify({
      requests: [
        {
          image: {
            content: croppedImageBase64
          },
          features: [
            {
              type: "TEXT_DETECTION"
            }
          ]
        }
      ]
    });

    const ocrJSON = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${key}`,
      {
        method: "POST",
        body
      }
    ).then(async res => {
      if (res.status < 200 || res.status > 299) {
        console.error(
          "Something went wrong: " + JSON.stringify(await res.json())
        );
        throw Error(`something went wrong with GoogleOCR`);
      }
      return res.json();
    });

    return ocrJSON.responses[0].fullTextAnnotation.text.trim();
  };

  changeOCR = e => {
    console.log(e.target.name + " = " + e.target.value);
    this.setState({ useGoogleOCR: !this.state.useGoogleOCR });
  };

  render() {
    const {
      src,
      crop,
      croppedImageUrl,
      txt,
      isProcessing,
      useGoogleOCR
    } = this.state;
    return (
      <LoadingOverlay
        active={isProcessing}
        spinner
        text="Processing selected image area"
      >
        <div className="wrapper">
          <h1>TEH P@SSBOOK VERIFIER</h1>
          <div>
            <label>USE:&nbsp;</label>
            <input
              type="radio"
              checked={!useGoogleOCR}
              onChange={this.changeOCR}
              name="tes"
            />
            Tesseract |
            <input
              type="radio"
              checked={!!useGoogleOCR}
              onChange={this.changeOCR}
              name="goo"
            />{" "}
            Google OCR
          </div>
          <div className="App">
            <div>
              <div>
                <input type="file" onChange={this.onSelectFile} />
              </div>
              <div style={{ minHeight: "1000px" }}>
                {src && (
                  <ReactCrop
                    src={src}
                    crop={crop}
                    onImageLoaded={this.onImageLoaded}
                    onComplete={this.onCropComplete}
                    onChange={this.onCropChange}
                  />
                )}
              </div>
            </div>
            <div>
              <div className="cropped">
                <h3>Selected Area</h3>
                {croppedImageUrl && (
                  <img
                    alt="Crop"
                    style={{ maxWidth: "100%" }}
                    src={croppedImageUrl}
                  />
                )}
                <div className="ocr-result"> {txt && <span>{txt}</span>}</div>
              </div>
              <div>
                {["Account Number", "Name", "Date of Birth"].map(name => (
                  <div className="field" key={name}>
                    <span>{name}:&nbsp;</span>
                    <input
                      type="text"
                      onChange={event => this.setField(name, event)}
                    />
                    <button onClick={async () => this.recognize(name)}>
                      {/* <button onClick={() => this.fetchFromGoogleOCR()}> */}
                      validate this
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </LoadingOverlay>
    );
  }
}

export default App;
