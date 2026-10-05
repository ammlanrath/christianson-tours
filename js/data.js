/**
 * Christianson Tours — Central Static Data Store
 * Source of truth for tours, packages, itineraries, hotel pickups, addons, reviews, and FAQs.
 */

window.CHRISTIANSON_DATA = {
  tours: [
    {
      id: "grand-canyon-west",
      slug: "grand-canyon-west",
      name: "Grand Canyon West Rim Tour",
      tagline: "From Las Vegas to one of the Southwest's most spectacular natural wonders.",
      badge: "Most Popular Choice",
      rating: 4.9,
      reviewCount: 1990,
      duration: "Full Day (10.5 Hours)",
      durationType: "full-day",
      category: "canyon",
      startingPrice: 97,
      heroImage: "https://lh3.googleusercontent.com/aida/AEtjO1XotMXw9VUOOt1Qv48v9Nh0DxlwCXKGYPqSOs5VJlxng3o1G_REP6WAV9D94zOfQfssmgN0H0LVO2Xzvb1j8nPqTAq5Rq2K2iIrsqhv9DNVHyWFSX7CylTIn52sQoXgAw7UvBZDP9ETlB-USJnoYpaq9qS5Huz9zFCiYSlE11DZ_J19qL5082yqzckhf1h32gciopr40W4KFOhHh9H1C-hCAf3v036zOLvXqqlW9W73CbpYlDa-knOO3fbS",
      summary: "Journey from Las Vegas through the Joshua Tree forest to the sovereign Hualapai Nation at the Grand Canyon West Rim. Enjoy 4 full hours exploring Eagle Point, Guano Point, and optional Skywalk access.",
      highlights: [
        "Complimentary Las Vegas Strip & Downtown hotel lobby pickup",
        "4 full hours exploring the Grand Canyon West Rim",
        "Hualapai park entrance permit included",
        "Eagle Point & Guano Point 360-degree canyon overlooks",
        "Fresh continental breakfast & deli picnic lunch included",
        "State-of-the-art climate-controlled luxury vehicle"
      ],
      packages: [
        {
          id: "good",
          name: "Standard Experience",
          subtitle: "Essential West Rim Tour",
          price: 97,
          originalPrice: 139,
          badge: "Best Value",
          pickup: true,
          admission: true,
          breakfast: true,
          lunch: false,
          skywalk: false,
          heli: false,
          features: [
            "Hotel Pickup & Return",
            "Hualapai Park Entry ($50 value)",
            "Continental Breakfast",
            "Live Driver-Guide Commentary",
            "Eagle & Guano Point access"
          ]
        },
        {
          id: "better",
          name: "Plus Experience",
          subtitle: "Includes Canyon Deli Lunch",
          price: 119,
          originalPrice: 159,
          badge: "Most Booked",
          pickup: true,
          admission: true,
          breakfast: true,
          lunch: true,
          skywalk: false,
          heli: false,
          features: [
            "Hotel Pickup & Return",
            "Hualapai Park Entry ($50 value)",
            "Continental Breakfast",
            "Catered Deli Picnic Lunch at Rim",
            "Live Driver-Guide Commentary",
            "Eagle & Guano Point access"
          ]
        },
        {
          id: "best",
          name: "Ultimate Experience",
          subtitle: "Full Inclusions + Skywalk Glass Bridge",
          price: 149,
          originalPrice: 189,
          badge: "Complete Package",
          pickup: true,
          admission: true,
          breakfast: true,
          lunch: true,
          skywalk: true,
          heli: false,
          features: [
            "Hotel Pickup & Return",
            "Hualapai Park Entry ($50 value)",
            "Skywalk Glass Bridge VIP Ticket",
            "Continental Breakfast",
            "Catered Deli Picnic Lunch at Rim",
            "Live Driver-Guide Commentary",
            "Eagle & Guano Point access"
          ]
        }
      ],
      itinerary: [
        {
          time: "6:15 AM - 6:45 AM",
          title: "Las Vegas Hotel Pickup",
          location: "Las Vegas Strip & Downtown Resorts",
          description: "Executive vehicle pickup at designated resort lobby entrances. Meet your professional naturalist guide.",
          image: "https://images.unsplash.com/photo-1581351123004-757df051db8e?auto=format&fit=crop&w=800&q=80",
          icon: "🚌"
        },
        {
          time: "7:15 AM",
          title: "Mojave Desert & Joshua Tree Forest",
          location: "Eldorado Valley Highway",
          description: "Drive through ancient 900-year-old Joshua Tree woodlands with live geological commentary.",
          image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80",
          icon: "🌵"
        },
        {
          time: "8:15 AM",
          title: "Hoover Dam Photo Stop",
          location: "Bypass Bridge Memorial Walkway",
          description: "Stop at the Mike O'Callaghan-Pat Tillman Bypass Bridge for panoramic morning photos over Black Canyon.",
          image: "https://lh3.googleusercontent.com/aida/AEtjO1VJcOp5we5Ddu4quv_s8ZI7Dr5C3Zj7Q8T9mbQtttXHTVC_GRBxmLstPcOHeEHC9Vz8kgE7GwUaVZkg98i8BQw0_cpDS7Zg5GQ34UZ_TRHimb7hgApY0Idz-9lSFECN55hZ6VwFVFOqPwQ9igX1ZP-ITbSg44yHWLGogyArm2F4PDfbCJovKx21lTHZKd-01zFsdjZlROLfXQ6ORSekrEUh6Eiraq5uZujX7MgbId916f44ia1qRIOfxj6x",
          icon: "🌊"
        },
        {
          time: "10:30 AM",
          title: "West Rim & Eagle Point Arrival",
          location: "Hualapai Native Lands",
          description: "Explore Native American cultural village exhibits and step onto the glass Skywalk cantilever bridge.",
          image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80",
          icon: "🦅"
        },
        {
          time: "12:30 PM",
          title: "Guano Point 360° Picnic Lunch",
          location: "Guano Point Overlook",
          description: "Enjoy a catered picnic lunch surrounded by 360-degree canyon gorge drop-offs and historical tramway ruins.",
          image: "https://lh3.googleusercontent.com/aida/AEtjO1XotMXw9VUOOt1Qv48v9Nh0DxlwCXKGYPqSOs5VJlxng3o1G_REP6WAV9D94zOfQfssmgN0H0LVO2Xzvb1j8nPqTAq5Rq2K2iIrsqhv9DNVHyWFSX7CylTIn52sQoXgAw7UvBZDP9ETlB-USJnoYpaq9qS5Huz9zFCiYSlE11DZ_J19qL5082yqzckhf1h32gciopr40W4KFOhHh9H1C-hCAf3v036zOLvXqqlW9W73CbpYlDa-knOO3fbS",
          icon: "🥪"
        },
        {
          time: "5:30 PM",
          title: "Return to Las Vegas Resort",
          location: "Las Vegas Hotel Drop-Off",
          description: "Comfortable return cruise to your resort lobby in time for dinner and evening shows.",
          image: "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&w=800&q=80",
          icon: "🏙️"
        }
      ]
    },
    {
      id: "hoover-dam",
      slug: "hoover-dam",
      name: "Hoover Dam Express Highlights",
      tagline: "Experience the greatest engineering triumph of the 20th century in a crisp half-day tour.",
      badge: "Best Half-Day Option",
      rating: 4.9,
      reviewCount: 840,
      duration: "Half Day (4.5 Hours)",
      durationType: "half-day",
      category: "hoover-dam",
      startingPrice: 50,
      heroImage: "https://lh3.googleusercontent.com/aida/AEtjO1VJcOp5we5Ddu4quv_s8ZI7Dr5C3Zj7Q8T9mbQtttXHTVC_GRBxmLstPcOHeEHC9Vz8kgE7GwUaVZkg98i8BQw0_cpDS7Zg5GQ34UZ_TRHimb7hgApY0Idz-9lSFECN55hZ6VwFVFOqPwQ9igX1ZP-ITbSg44yHWLGogyArm2F4PDfbCJovKx21lTHZKd-01zFsdjZlROLfXQ6ORSekrEUh6Eiraq5uZujX7MgbId916f44ia1qRIOfxj6x",
      summary: "Witness 20th-century engineering prowess. Walk the Mike O'Callaghan-Pat Tillman Memorial Bypass Bridge 900 feet above Black Canyon, followed by Lake Mead vistas and historic Boulder City.",
      highlights: [
        "Express morning hotel lobby pickup in Las Vegas",
        "Pedestrian walkway on the 900-ft high Bypass Bridge",
        "Photo stops at Arizona/Nevada state line & Lake Mead Overlook",
        "Historic Boulder City stop on the return drive",
        "Return to Las Vegas by 1:00 PM for a free afternoon"
      ],
      packages: [
        {
          id: "hoover-standard",
          name: "Express Hoover Dam Tour",
          subtitle: "Half-Day Guided Tour",
          price: 50,
          originalPrice: 75,
          badge: "Top Value",
          pickup: true,
          admission: true,
          breakfast: true,
          lunch: false,
          skywalk: false,
          heli: false,
          features: [
            "Hotel Pickup & Return",
            "Bypass Bridge Walkway Access",
            "Live Guide Commentary",
            "Lake Mead Overlook Stop",
            "Boulder City Historic District"
          ]
        }
      ],
      itinerary: [
        {
          time: "7:30 AM - 8:00 AM",
          title: "Las Vegas Hotel Express Pickup",
          location: "Strip & Downtown Resorts",
          description: "Comfortable pickup directly from major Las Vegas hotel lobby entrances.",
          image: "https://images.unsplash.com/photo-1581351123004-757df051db8e?auto=format&fit=crop&w=800&q=80",
          icon: "🚌"
        },
        {
          time: "8:45 AM",
          title: "Bypass Bridge & Black Canyon Overlook",
          location: "Mike O'Callaghan-Pat Tillman Bridge",
          description: "Walk the pedestrian bridge 900 feet above the Colorado River for dramatic dam and gorge photos.",
          image: "https://lh3.googleusercontent.com/aida/AEtjO1VJcOp5we5Ddu4quv_s8ZI7Dr5C3Zj7Q8T9mbQtttXHTVC_GRBxmLstPcOHeEHC9Vz8kgE7GwUaVZkg98i8BQw0_cpDS7Zg5GQ34UZ_TRHimb7hgApY0Idz-9lSFECN55hZ6VwFVFOqPwQ9igX1ZP-ITbSg44yHWLGogyArm2F4PDfbCJovKx21lTHZKd-01zFsdjZlROLfXQ6ORSekrEUh6Eiraq5uZujX7MgbId916f44ia1qRIOfxj6x",
          icon: "🌉"
        },
        {
          time: "10:15 AM",
          title: "Lake Mead Vista & Dam Crest",
          location: "Lake Mead National Recreation Area",
          description: "Capture panoramic photos across America's largest man-made reservoir.",
          image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80",
          icon: "📷"
        },
        {
          time: "11:30 AM",
          title: "Historic Boulder City Stop",
          location: "Boulder City, NV",
          description: "Explore the charming 1930s town built exclusively for Hoover Dam construction workers.",
          image: "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&w=800&q=80",
          icon: "🏡"
        },
        {
          time: "1:00 PM",
          title: "Return to Las Vegas",
          location: "Las Vegas Hotel Drop-Off",
          description: "Arrive back at your hotel with the full afternoon remaining for dining and entertainment.",
          image: "https://images.unsplash.com/photo-1581351123004-757df051db8e?auto=format&fit=crop&w=800&q=80",
          icon: "🏁"
        }
      ]
    },
    {
      id: "private-charter",
      slug: "private-charter",
      name: "Private Group & Charter Excursions",
      tagline: "Tailored southwestern group travel for family reunions, weddings, and corporate events.",
      badge: "VIP Exclusive",
      rating: 5.0,
      reviewCount: 210,
      duration: "Custom (Flexible)",
      durationType: "private",
      category: "private",
      startingPrice: 350,
      heroImage: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Grand_Canyon_Hopi_Point_with_rainbow_2013.jpg/960px-Grand_Canyon_Hopi_Point_with_rainbow_2013.jpg",
      summary: "Enjoy a private vehicle and dedicated naturalist driver-guide exclusively for your group. Tailor departure times, route stops, and meal options.",
      highlights: [
        "Dedicated executive vehicle exclusively for your private group",
        "Custom pickup schedule & resort location flexibility",
        "Personalized itinerary stops at Grand Canyon, Hoover Dam, or Valley of Fire",
        "Custom catering & dietary accommodation options",
        "Dedicated interpretive guide for private narration"
      ],
      packages: [
        {
          id: "private-standard",
          name: "Private Executive Charter",
          subtitle: "Dedicated Group Experience",
          price: 350,
          originalPrice: 450,
          badge: "Custom Quote",
          pickup: true,
          admission: true,
          breakfast: true,
          lunch: true,
          skywalk: false,
          heli: false,
          features: [
            "Private Vehicle & Driver-Guide",
            "Custom Pickup Time & Location",
            "Tailored Itinerary",
            "Catered Group Meals",
            "Dedicated Naturalist Commentary"
          ]
        }
      ],
      itinerary: [
        {
          time: "Flexible",
          title: "Private Hotel Pickup",
          location: "Your Designated Resort",
          description: "Custom morning departure scheduled around your group's preference.",
          image: "https://images.unsplash.com/photo-1581351123004-757df051db8e?auto=format&fit=crop&w=800&q=80",
          icon: "⭐"
        }
      ]
    }
  ],

  addons: [
    {
      id: "skywalk-pass",
      name: "Grand Canyon Skywalk VIP Glass Bridge Pass",
      description: "Walk out 70 feet over the canyon rim on a U-shaped glass bridge suspended 4,000 feet above the Colorado River floor.",
      price: 35,
      tours: ["grand-canyon-west"]
    },
    {
      id: "hot-lunch-upgrade",
      name: "Hot Canyon-Side Meal Upgrade",
      description: "Upgrade your lunch at Guano Point from a deli picnic to a hot grilled chicken or BBQ ribs platter.",
      price: 15,
      tours: ["grand-canyon-west"]
    },
    {
      id: "heli-pontoon-combo",
      name: "Helicopter & Colorado River Boat Combo (Demo Add-on)",
      description: "Descending 4,000 feet into the canyon floor by helicopter followed by a pontoon boat ride on the Colorado River.",
      price: 245,
      tours: ["grand-canyon-west"]
    }
  ],

  hotels: [
    { id: "bellagio", name: "Bellagio Las Vegas", zone: "Strip Central", pickupTime: "6:20 AM", location: "Underground Bus Concourse Entrance" },
    { id: "caesars", name: "Caesars Palace", zone: "Strip Central", pickupTime: "6:30 AM", location: "Main Tour Bus Entrance (Colosseum side)" },
    { id: "mgm-grand", name: "MGM Grand", zone: "Strip South", pickupTime: "6:10 AM", location: "Underground Tour Bus Lobby" },
    { id: "venetian", name: "The Venetian & Palazzo", zone: "Strip Central", pickupTime: "6:25 AM", location: "Lower Level Bus Depot" },
    { id: "wynn", name: "Wynn & Encore Las Vegas", zone: "Strip North", pickupTime: "6:35 AM", location: "South Tour Bus Entrance" },
    { id: "resorts-world", name: "Resorts World Las Vegas", zone: "Strip North", pickupTime: "6:40 AM", location: "Main Bus Lobby" },
    { id: "circus-circus", name: "Circus Circus Hotel", zone: "Strip North", pickupTime: "6:45 AM", location: "Rear Tour Bus Entrance" },
    { id: "circus-circus-marriott", name: "Marriott Grand Chateau", zone: "Strip Central", pickupTime: "6:15 AM", location: "Valet Entrance" },
    { id: "fremont-golden-nugget", name: "Golden Nugget (Downtown)", zone: "Downtown", pickupTime: "6:00 AM", location: "Carson Tower Entrance" }
  ],

  reviews: [
    {
      id: 1,
      author: "Krystal Thomas",
      rating: 5,
      date: "August 2025",
      tour: "Grand Canyon West Rim Tour",
      tags: ["GUIDES", "DRIVERS", "GRAND CANYON"],
      comment: "This trip was amazing. First, the bus was on time. Second, the driver was entertaining throughout the trip. Lastly, the Hoover Dam & the Grand Canyon were awesome! The continental bfkt & deli lunch was enough. Anything heavier would've been too much.",
      ownerResponse: "Thank you Krystal! We pride ourselves on punctual hotel pickups and great guide stories."
    },
    {
      id: 2,
      author: "Donovan E.",
      rating: 5,
      date: "September 2025",
      tour: "Grand Canyon West Rim Tour",
      tags: ["DRIVERS", "SAFETY", "COMFORT"],
      comment: "Recently took the Grand Canyon tour. The bus was on time at the pick up location. The bus was neat and clean. Paul (our tour host) was very polite and knowledgeable.",
      ownerResponse: null
    },
    {
      id: 3,
      author: "Toni F.",
      rating: 5,
      date: "July 2025",
      tour: "Hoover Dam Highlights",
      tags: ["GUIDES", "SAFETY", "HOOVER DAM"],
      comment: "What a great tour of the Hoover Dam and Grand Canyon with Jackie! She was AMAZING! Great driver—I felt super safe with her. She is witty and made everyone feel comfortable.",
      ownerResponse: "Thank you Toni! Jackie is one of our most requested guides—we're glad she made your day special."
    },
    {
      id: 4,
      author: "Marcus Vance",
      rating: 5,
      date: "June 2025",
      tour: "Grand Canyon West Rim Tour",
      tags: ["FAMILIES", "GUIDES", "GRAND CANYON"],
      comment: "Traveled with our family of 5 including two teenagers. The timing at Guano Point was perfect—never felt rushed. Our guide explained the Native American culture with real respect.",
      ownerResponse: null
    },
    {
      id: 5,
      author: "Sarah Jenkins",
      rating: 5,
      date: "May 2025",
      tour: "Hoover Dam Highlights",
      tags: ["HOOVER DAM", "COMFORT", "DRIVERS"],
      comment: "The half day Hoover Dam tour was the highlight of our Vegas trip. Back by 1 PM so we still had the afternoon for pool and dinner. Ultra clean bus!",
      ownerResponse: null
    }
  ],

  faqs: [
    {
      category: "PICKUP",
      question: "How does Las Vegas hotel pickup work?",
      answer: "We provide complimentary pickup at all major Las Vegas Strip and Downtown resort properties. When booking, select your hotel from the dropdown list. Your confirmation email will list the exact designated lobby entrance and precise pickup time (typically between 6:00 AM and 6:45 AM)."
    },
    {
      category: "PICKUP",
      question: "How early should I be ready at my hotel pickup point?",
      answer: "Please arrive at your designated hotel tour entrance 10 minutes before your scheduled pickup time. Our driver-guides maintain a strict schedule to ensure all guests maximize their time at the Grand Canyon."
    },
    {
      category: "CANCELLATION",
      question: "What is your cancellation & refund policy?",
      answer: "Cancellations made 24 hours or more prior to your scheduled tour departure receive a 100% full refund. Cancellations within 24 hours can be rescheduled to an alternate available date."
    },
    {
      category: "FOOD",
      question: "What food and drinks are included?",
      answer: "Full-day Grand Canyon tours include a morning continental breakfast and a catered deli picnic lunch at Guano Point. Unlimited chilled bottled water is provided throughout the trip. Special vegetarian options are available upon request."
    },
    {
      category: "TOURS",
      question: "How much time do we spend at the Grand Canyon West Rim?",
      answer: "You will enjoy 4 full hours at the West Rim! This gives you ample time to explore Eagle Point, step onto the Skywalk glass bridge, hike around Guano Point, and enjoy lunch overlooking the canyon."
    },
    {
      category: "WHAT TO BRING",
      question: "What should I wear and bring on the tour?",
      answer: "We recommend comfortable walking shoes, layer-friendly clothing (canyon weather can be breezy), sunglasses, sunscreen, a hat, and a camera or smartphone. Don't forget your photo ID for park entry."
    },
    {
      category: "ACCESSIBILITY",
      question: "Are your vehicles and tour locations wheelchair accessible?",
      answer: "Yes, our executive fleet and our Las Vegas departure points feature accessible facilities. The Hualapai shuttle buses at the West Rim are also ADA compliant. Please notify us during booking if you require wheelchair assistance."
    },
    {
      category: "CHILDREN",
      question: "Are children allowed on your Grand Canyon and Hoover Dam tours?",
      answer: "Yes! Children of all ages are welcome. Car seats are required for infants and toddlers in accordance with Nevada & Arizona highway regulations."
    }
  ]
};
