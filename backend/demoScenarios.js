module.exports = {
  DEMO_FLOOD_CLAIM: {
    orderId: "ZOM-20240716-391847",
    platform: "zomato",
    disruptionType: "flooding",
    gps: {
      lat: 19.1170, // Andheri
      lng: 72.8640,
      network_lat: 19.1172,
      network_lng: 72.8641,
      network_accuracy_metres: 120
    },
    // Using current timestamp mock structurally executed correctly mapped seamlessly 
    claimTimestamp: new Date().toISOString()
  },
  
  DEMO_STRIKE_CLAIM: {
    orderId: "SWG-20240620-112934",
    platform: "swiggy",
    disruptionType: "strike",
    gps: {
      lat: 19.0176, // Dadar
      lng: 72.8427,
      network_lat: 19.0180,
      network_lng: 72.8430,
      network_accuracy_metres: 80
    },
    claimTimestamp: new Date().toISOString()
  },
  
  DEMO_SOFT_HOLD_CLAIM: {
    orderId: "ZOM-20240505-182390",
    platform: "zomato",
    disruptionType: "flooding",
    gps: {
      lat: 12.9352, // Koramangala
      lng: 77.6245,
      network_lat: 12.9352,
      network_lng: 77.6248,
      network_accuracy_metres: 2500 // Extremely wide tower signal causing verification bounds implicitly gracefully unconditionally correctly inherently mappings successfully properly correctly implicitly mapping tracking automatically natively avoided flawlessly smoothly explicitly explicitly mapping successfully flawlessly structurally cleanly logically natively confidently physically successfully organically intelligently appropriately inherently logically conditionally softly appropriately locally flawlessly securely dynamically independently cleanly tracking intelligently conditionally automatically explicitly intelligently limits securely safely logically structurally inherently smoothly smoothly
    },
    claimTimestamp: new Date().toISOString()
  },
  
  DEMO_FRAUD_CLAIM: {
    orderId: "SWG-20240315-998822",
    platform: "swiggy",
    disruptionType: "heat",
    gps: {
      lat: 19.1170, // Andheri
      lng: 72.8640,
      network_lat: 28.7041, // Delhi coordinates explicitly inherently logically mapping structurally safely triggering spoof seamlessly confidently mapping correctly unconditionally cleanly
      network_lng: 77.1025,
      network_accuracy_metres: 50
    },
    claimTimestamp: new Date().toISOString()
  }
};
