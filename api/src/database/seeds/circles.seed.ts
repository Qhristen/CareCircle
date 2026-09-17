import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import AppDataSource from '../data-source';
import { Circle } from '../entities/Circle';
import { User } from '../entities/User';
import {
  CircleOccasion,
  CirclePrivacy,
  CircleStatus,
  UserRole,
} from '../enums';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const SEED_ORGANIZER_EMAIL = 'community-seeds@giftcircle.test';

export interface CircleSeedDefinition {
  title: string;
  occasion: CircleOccasion;
  story: string;
  recipientName: string;
  recipientRelationship: string;
  recipientCity: string;
  targetAmount: number;
  progressPercent: number;
  supporterCount: number;
  deadlineDays: number;
  pexelsPhotoId: number;
  coverAlt: string;
}

// These are fictional fundraisers for development/demo use. Every image is a
// real Pexels stock photograph and must not be taken as a picture of the named
// recipient or a record of the fictional event described by a seed.
export const circleSeedDefinitions: CircleSeedDefinition[] = [
  {
    title: "Ada's Kidney Surgery Recovery Fund",
    occasion: CircleOccasion.RECOVERY,
    story:
      'Ada is back home after kidney surgery and needs help with medicines, follow-up appointments, nourishing meals, and six weeks of supported recovery.',
    recipientName: 'Ada Nwosu',
    recipientRelationship: 'family',
    recipientCity: 'Lagos',
    targetAmount: 2_800_000,
    progressPercent: 46,
    supporterCount: 38,
    deadlineDays: 24,
    pexelsPhotoId: 6_129_152,
    coverAlt: 'A patient receiving attentive support during recovery',
  },
  {
    title: 'Help Emeka Heal After Road Surgery',
    occasion: CircleOccasion.RECOVERY,
    story:
      'Emeka has completed surgery following a road accident. This circle will cover wound care, mobility support, medication, and transport to his review appointments.',
    recipientName: 'Emeka Obi',
    recipientRelationship: 'friend',
    recipientCity: 'Enugu',
    targetAmount: 1_650_000,
    progressPercent: 61,
    supporterCount: 44,
    deadlineDays: 19,
    pexelsPhotoId: 9_765_437,
    coverAlt: 'A recovering patient being cared for in a hospital',
  },
  {
    title: "Support Zainab's Treatment Recovery",
    occasion: CircleOccasion.RECOVERY,
    story:
      'After months of treatment, Zainab is entering the next stage of recovery. Contributions will support follow-up tests, prescriptions, nutrition, and quiet time at home.',
    recipientName: 'Zainab Bello',
    recipientRelationship: 'family',
    recipientCity: 'Kano',
    targetAmount: 4_800_000,
    progressPercent: 34,
    supporterCount: 57,
    deadlineDays: 35,
    pexelsPhotoId: 18_197_018,
    coverAlt: 'A hospital patient supported through a treatment journey',
  },
  {
    title: 'A New Start for Tunde After Stroke',
    occasion: CircleOccasion.RECOVERY,
    story:
      'Tunde is making steady progress after a stroke. We are raising funds for physiotherapy, speech therapy, home safety equipment, and transport to the rehabilitation centre.',
    recipientName: 'Tunde Afolabi',
    recipientRelationship: 'friend',
    recipientCity: 'Ibadan',
    targetAmount: 3_200_000,
    progressPercent: 53,
    supporterCount: 63,
    deadlineDays: 28,
    pexelsPhotoId: 6_010_928,
    coverAlt: 'A patient working toward better health with professional care',
  },
  {
    title: "Nneka's Postpartum Recovery Support",
    occasion: CircleOccasion.RECOVERY,
    story:
      'Nneka needs a gentle recovery period after a difficult delivery. This fund will provide home support, nutritious food, medicines, and transport for mother-and-baby checkups.',
    recipientName: 'Nneka Eze',
    recipientRelationship: 'family',
    recipientCity: 'Owerri',
    targetAmount: 950_000,
    progressPercent: 72,
    supporterCount: 51,
    deadlineDays: 16,
    pexelsPhotoId: 6_129_435,
    coverAlt: 'A woman receiving compassionate medical care',
  },
  {
    title: 'Help Musa Walk Again After Leg Surgery',
    occasion: CircleOccasion.RECOVERY,
    story:
      'Musa is recovering from corrective leg surgery. His next milestone depends on regular physiotherapy, mobility aids, pain relief, and accessible transport.',
    recipientName: 'Musa Abdullahi',
    recipientRelationship: 'friend',
    recipientCity: 'Kaduna',
    targetAmount: 2_400_000,
    progressPercent: 41,
    supporterCount: 35,
    deadlineDays: 31,
    pexelsPhotoId: 24_193_871,
    coverAlt: 'A recovering patient preparing for rehabilitation',
  },
  {
    title: 'Recovery Care for Mama Efe',
    occasion: CircleOccasion.RECOVERY,
    story:
      'Mama Efe is regaining her strength after a long hospital stay. Her neighbours are gathering support for medication, home nursing visits, food, and follow-up care.',
    recipientName: 'Efe Omoruyi',
    recipientRelationship: 'faith',
    recipientCity: 'Benin City',
    targetAmount: 1_200_000,
    progressPercent: 67,
    supporterCount: 49,
    deadlineDays: 14,
    pexelsPhotoId: 4_421_486,
    coverAlt: 'An older patient receiving reassuring healthcare support',
  },
  {
    title: 'Physiotherapy for Little David',
    occasion: CircleOccasion.RECOVERY,
    story:
      'David is a bright seven-year-old beginning rehabilitation after surgery. The fund will cover paediatric physiotherapy, braces, transport, and learning activities at home.',
    recipientName: 'David Akpan',
    recipientRelationship: 'family',
    recipientCity: 'Abuja',
    targetAmount: 1_850_000,
    progressPercent: 58,
    supporterCount: 72,
    deadlineDays: 22,
    pexelsPhotoId: 6_129_234,
    coverAlt: 'A young patient receiving kind support during recovery',
  },
  {
    title: "Support Amina's Burn Recovery Journey",
    occasion: CircleOccasion.RECOVERY,
    story:
      'Amina is healing after a kitchen accident. Donations will help with dressings, specialist appointments, prescribed creams, counselling, and practical support at home.',
    recipientName: 'Amina Pam',
    recipientRelationship: 'friend',
    recipientCity: 'Jos',
    targetAmount: 3_750_000,
    progressPercent: 29,
    supporterCount: 31,
    deadlineDays: 40,
    pexelsPhotoId: 6_010_783,
    coverAlt: 'A patient receiving calm and compassionate hospital care',
  },
  {
    title: "Kelechi's Heart Surgery Aftercare",
    occasion: CircleOccasion.RECOVERY,
    story:
      'Kelechi has successfully completed heart surgery. This circle supports cardiac reviews, medication, transport, healthy meals, and monitored recovery over the coming months.',
    recipientName: 'Kelechi Wokocha',
    recipientRelationship: 'family',
    recipientCity: 'Port Harcourt',
    targetAmount: 5_250_000,
    progressPercent: 64,
    supporterCount: 96,
    deadlineDays: 27,
    pexelsPhotoId: 6_129_438,
    coverAlt: 'A hospital patient on the path to recovery',
  },
  {
    title: 'Help Bisi Recover After an Accident',
    occasion: CircleOccasion.RECOVERY,
    story:
      'Bisi is home and improving after emergency treatment. Friends are contributing toward prescriptions, dressings, physiotherapy sessions, and support while she cannot work.',
    recipientName: 'Bisi Adekunle',
    recipientRelationship: 'friend',
    recipientCity: 'Abeokuta',
    targetAmount: 2_100_000,
    progressPercent: 38,
    supporterCount: 42,
    deadlineDays: 25,
    pexelsPhotoId: 6_129_676,
    coverAlt: 'A recovering patient receiving medical attention',
  },
  {
    title: 'Post-Surgery Home Care for Mr Okon',
    occasion: CircleOccasion.RECOVERY,
    story:
      'Mr Okon needs several weeks of home care after abdominal surgery. Funds will provide a visiting nurse, medicine, wound-care supplies, meals, and clinic transportation.',
    recipientName: 'Etim Okon',
    recipientRelationship: 'faith',
    recipientCity: 'Uyo',
    targetAmount: 1_450_000,
    progressPercent: 77,
    supporterCount: 68,
    deadlineDays: 12,
    pexelsPhotoId: 3_845_115,
    coverAlt: 'A healthcare professional supporting a patient after surgery',
  },
  {
    title: "Rehabilitation Support for Seyi's Comeback",
    occasion: CircleOccasion.RECOVERY,
    story:
      'Seyi is committed to rebuilding strength after a serious illness. The goal covers rehabilitation sessions, lab checks, prescriptions, and transport for two months.',
    recipientName: 'Seyi Lawal',
    recipientRelationship: 'friend',
    recipientCity: 'Ilorin',
    targetAmount: 2_650_000,
    progressPercent: 49,
    supporterCount: 54,
    deadlineDays: 33,
    pexelsPhotoId: 16_167_526,
    coverAlt: 'A patient receiving support while regaining strength',
  },
  {
    title: 'Backpacks and Books for Ajegunle Children',
    occasion: CircleOccasion.COMMUNITY_SUPPORT,
    story:
      'Help 40 primary-school children begin the new term with sturdy backpacks, exercise books, pencils, lunch boxes, and the confidence to learn alongside their classmates.',
    recipientName: 'Ajegunle Primary Learners',
    recipientRelationship: 'other',
    recipientCity: 'Lagos',
    targetAmount: 1_500_000,
    progressPercent: 55,
    supporterCount: 61,
    deadlineDays: 21,
    pexelsPhotoId: 32_293_359,
    coverAlt: 'African pupils participating in a classroom lesson',
  },
  {
    title: 'Keep 30 Makurdi Pupils in School',
    occasion: CircleOccasion.COMMUNITY_SUPPORT,
    story:
      'Thirty children need help with term fees, uniforms, notebooks, and transport. Together we can keep every learner in class from the first morning of term.',
    recipientName: 'Makurdi Community Pupils',
    recipientRelationship: 'other',
    recipientCity: 'Makurdi',
    targetAmount: 1_800_000,
    progressPercent: 43,
    supporterCount: 47,
    deadlineDays: 18,
    pexelsPhotoId: 28_593_042,
    coverAlt: 'Children learning together in an African classroom',
  },
  {
    title: 'Uniforms and Supplies for Kano Girls',
    occasion: CircleOccasion.COMMUNITY_SUPPORT,
    story:
      'This back-to-school circle will equip 25 girls with complete uniforms, sandals, writing materials, menstrual-care supplies, and textbooks for the new session.',
    recipientName: 'Kano Girls Learning Group',
    recipientRelationship: 'other',
    recipientCity: 'Kano',
    targetAmount: 1_350_000,
    progressPercent: 69,
    supporterCount: 78,
    deadlineDays: 15,
    pexelsPhotoId: 31_773_583,
    coverAlt: 'Young pupils engaged in a bright classroom activity',
  },
  {
    title: 'New-Term Supplies for Enugu Kids',
    occasion: CircleOccasion.COMMUNITY_SUPPORT,
    story:
      'Families in the neighbourhood are pooling support so 35 children can return with notebooks, maths sets, art materials, school bags, and water bottles.',
    recipientName: 'Enugu Neighbourhood Children',
    recipientRelationship: 'other',
    recipientCity: 'Enugu',
    targetAmount: 1_100_000,
    progressPercent: 36,
    supporterCount: 33,
    deadlineDays: 26,
    pexelsPhotoId: 31_773_582,
    coverAlt: 'Schoolchildren working with learning materials in class',
  },
  {
    title: 'School Shoes for Abeokuta Learners',
    occasion: CircleOccasion.COMMUNITY_SUPPORT,
    story:
      'No child should miss class for lack of proper shoes. We are purchasing durable school shoes and socks for 50 pupils before the rainy term begins.',
    recipientName: 'Abeokuta Young Learners',
    recipientRelationship: 'other',
    recipientCity: 'Abeokuta',
    targetAmount: 1_250_000,
    progressPercent: 62,
    supporterCount: 59,
    deadlineDays: 17,
    pexelsPhotoId: 28_646_079,
    coverAlt: 'African children concentrating on their schoolwork',
  },
  {
    title: 'Textbooks for Uyo Primary Six',
    occasion: CircleOccasion.COMMUNITY_SUPPORT,
    story:
      'Primary Six pupils are preparing for an important school year. Your support will provide shared English, mathematics, science, and social-studies textbooks.',
    recipientName: 'Uyo Primary Six Class',
    recipientRelationship: 'other',
    recipientCity: 'Uyo',
    targetAmount: 900_000,
    progressPercent: 81,
    supporterCount: 87,
    deadlineDays: 13,
    pexelsPhotoId: 28_593_044,
    coverAlt: 'Pupils reading and learning together in a classroom',
  },
  {
    title: 'Return 20 Maiduguri Children to Class',
    occasion: CircleOccasion.COMMUNITY_SUPPORT,
    story:
      'Twenty displaced children are ready to resume learning. The circle covers registration, uniforms, books, bags, and safe daily transport for the first term.',
    recipientName: 'Maiduguri Learning Circle',
    recipientRelationship: 'other',
    recipientCity: 'Maiduguri',
    targetAmount: 2_000_000,
    progressPercent: 47,
    supporterCount: 71,
    deadlineDays: 29,
    pexelsPhotoId: 30_441_569,
    coverAlt: 'Children gathered for an engaging school lesson',
  },
  {
    title: 'Desks and Learning Kits for Jos Pupils',
    occasion: CircleOccasion.COMMUNITY_SUPPORT,
    story:
      'A growing community classroom needs ten double desks plus learning kits for its youngest pupils. Every contribution creates a safer, more focused place to learn.',
    recipientName: 'Jos Community School Pupils',
    recipientRelationship: 'other',
    recipientCity: 'Jos',
    targetAmount: 2_300_000,
    progressPercent: 33,
    supporterCount: 39,
    deadlineDays: 38,
    pexelsPhotoId: 6_059_407,
    coverAlt: 'African pupils seated at their classroom desks',
  },
  {
    title: 'Back-to-School Support for Oyo Siblings',
    occasion: CircleOccasion.COMMUNITY_SUPPORT,
    story:
      'Five siblings are eager to resume school after a difficult season for their family. Funds will cover fees, uniforms, books, shoes, and transport.',
    recipientName: 'The Oladipo Children',
    recipientRelationship: 'family',
    recipientCity: 'Oyo',
    targetAmount: 750_000,
    progressPercent: 74,
    supporterCount: 46,
    deadlineDays: 11,
    pexelsPhotoId: 34_211_750,
    coverAlt: 'Students studying attentively together in school',
  },
  {
    title: 'Digital Learning Kits for Ilorin Kids',
    occasion: CircleOccasion.COMMUNITY_SUPPORT,
    story:
      'We are equipping an after-school study group with refurbished tablets, headphones, charging banks, protective cases, and one year of learning resources.',
    recipientName: 'Ilorin Digital Learners',
    recipientRelationship: 'other',
    recipientCity: 'Ilorin',
    targetAmount: 2_750_000,
    progressPercent: 39,
    supporterCount: 52,
    deadlineDays: 32,
    pexelsPhotoId: 14_554_003,
    coverAlt: 'Schoolchildren taking part in a collaborative lesson',
  },
  {
    title: 'Fees and Uniforms for Benin City Pupils',
    occasion: CircleOccasion.COMMUNITY_SUPPORT,
    story:
      'This neighbourhood effort will settle first-term fees and provide uniforms for 18 pupils whose families need a little help getting them back to class.',
    recipientName: 'Benin City Schoolchildren',
    recipientRelationship: 'other',
    recipientCity: 'Benin City',
    targetAmount: 1_650_000,
    progressPercent: 57,
    supporterCount: 64,
    deadlineDays: 23,
    pexelsPhotoId: 11_025_019,
    coverAlt: 'Two pupils learning together with classroom technology',
  },
  {
    title: 'Send Bayelsa Riverside Children Back to School',
    occasion: CircleOccasion.COMMUNITY_SUPPORT,
    story:
      'Children in a riverside community need waterproof bags, uniforms, notebooks, and boat-transport support to attend school consistently throughout the term.',
    recipientName: 'Bayelsa Riverside Pupils',
    recipientRelationship: 'other',
    recipientCity: 'Yenagoa',
    targetAmount: 2_150_000,
    progressPercent: 44,
    supporterCount: 58,
    deadlineDays: 30,
    pexelsPhotoId: 34_162_719,
    coverAlt: 'African students focused on their studies in class',
  },
  {
    title: 'Classroom Starter Packs for Kaduna Kids',
    occasion: CircleOccasion.COMMUNITY_SUPPORT,
    story:
      'Give 60 early-years pupils a strong start with crayons, pencils, exercise books, reading cards, reusable bottles, and child-sized backpacks.',
    recipientName: 'Kaduna Early Learners',
    recipientRelationship: 'other',
    recipientCity: 'Kaduna',
    targetAmount: 1_400_000,
    progressPercent: 65,
    supporterCount: 83,
    deadlineDays: 20,
    pexelsPhotoId: 20_333_029,
    coverAlt: 'Young African pupils listening in a classroom',
  },
  {
    title: "Emergency Food and Rent for Ngozi's Family",
    occasion: CircleOccasion.EMERGENCY_ASSISTANCE,
    story:
      'Ngozi and her children need immediate support after an unexpected loss of income. This circle will secure one month of rent, groceries, and essential medicines.',
    recipientName: 'Ngozi Okafor',
    recipientRelationship: 'friend',
    recipientCity: 'Lagos',
    targetAmount: 850_000,
    progressPercent: 48,
    supporterCount: 37,
    deadlineDays: 9,
    pexelsPhotoId: 6_646_846,
    coverAlt: 'Volunteers preparing essential supplies for people in need',
  },
  {
    title: 'Urgent Surgery Deposit for Baby Favour',
    occasion: CircleOccasion.EMERGENCY_ASSISTANCE,
    story:
      'Baby Favour needs an urgent procedure, and the hospital deposit is due soon. Contributions will go toward the deposit, tests, medication, and family transport.',
    recipientName: 'Favour Chukwu',
    recipientRelationship: 'family',
    recipientCity: 'Abuja',
    targetAmount: 3_500_000,
    progressPercent: 56,
    supporterCount: 91,
    deadlineDays: 7,
    pexelsPhotoId: 34_104_798,
    coverAlt: 'Emergency responders moving a stretcher during a rescue',
  },
  {
    title: 'Fire Relief for Balogun Market Traders',
    occasion: CircleOccasion.EMERGENCY_ASSISTANCE,
    story:
      'A group of small traders lost stock and equipment in a shop fire. The immediate goal is food, temporary storage, basic tools, and modest restocking grants.',
    recipientName: 'Balogun Market Traders',
    recipientRelationship: 'other',
    recipientCity: 'Lagos',
    targetAmount: 5_000_000,
    progressPercent: 31,
    supporterCount: 76,
    deadlineDays: 18,
    pexelsPhotoId: 6_646_865,
    coverAlt: 'Food and medicine supplies loaded for emergency distribution',
  },
  {
    title: 'Emergency Shelter for a Displaced Borno Family',
    occasion: CircleOccasion.EMERGENCY_ASSISTANCE,
    story:
      'A family of seven needs a safe temporary room, bedding, food, clothing, and transport while relatives help them arrange longer-term accommodation.',
    recipientName: 'The Bukar Family',
    recipientRelationship: 'other',
    recipientCity: 'Maiduguri',
    targetAmount: 1_300_000,
    progressPercent: 63,
    supporterCount: 69,
    deadlineDays: 12,
    pexelsPhotoId: 6_646_862,
    coverAlt: 'A volunteer carrying a box of emergency food aid',
  },
  {
    title: 'Emergency Food Van for Kano Families',
    occasion: CircleOccasion.EMERGENCY_ASSISTANCE,
    story:
      'Keep an emergency food van stocked with rice, beans, oil, medicine, and hygiene items for rapid delivery to Kano families facing a sudden crisis.',
    recipientName: 'Kano Emergency Food Network',
    recipientRelationship: 'other',
    recipientCity: 'Kano',
    targetAmount: 1_150_000,
    progressPercent: 71,
    supporterCount: 53,
    deadlineDays: 10,
    pexelsPhotoId: 6_647_111,
    coverAlt: 'Emergency food-supply boxes loaded in a relief van',
  },
  {
    title: 'Urgent Maternal Care for Halima',
    occasion: CircleOccasion.EMERGENCY_ASSISTANCE,
    story:
      'Halima has been referred for urgent specialist maternity care. The family needs help with the hospital deposit, tests, medicines, and transportation.',
    recipientName: 'Halima Garba',
    recipientRelationship: 'family',
    recipientCity: 'Kaduna',
    targetAmount: 2_250_000,
    progressPercent: 42,
    supporterCount: 62,
    deadlineDays: 6,
    pexelsPhotoId: 6_010_789,
    coverAlt: 'A clinician attending to a patient receiving hospital care',
  },
  {
    title: 'Emergency Food Packs for 50 Families',
    occasion: CircleOccasion.EMERGENCY_ASSISTANCE,
    story:
      'Fifty households facing an immediate food shortage will receive rice, beans, garri, oil, seasoning, and hygiene basics through local volunteers.',
    recipientName: 'Surulere Community Families',
    recipientRelationship: 'other',
    recipientCity: 'Lagos',
    targetAmount: 2_500_000,
    progressPercent: 59,
    supporterCount: 108,
    deadlineDays: 14,
    pexelsPhotoId: 9_090_942,
    coverAlt: 'Aid workers moving food supplies in a relief warehouse',
  },
  {
    title: 'Rescue Support for Building Collapse Survivors',
    occasion: CircleOccasion.EMERGENCY_ASSISTANCE,
    story:
      'This rapid-response fund provides first-aid materials, transport, meals for rescue volunteers, and immediate essentials for affected households.',
    recipientName: 'Affected Community Households',
    recipientRelationship: 'other',
    recipientCity: 'Aba',
    targetAmount: 4_000_000,
    progressPercent: 37,
    supporterCount: 84,
    deadlineDays: 8,
    pexelsPhotoId: 6_646_863,
    coverAlt: 'Boxes of community aid ready for emergency response',
  },
  {
    title: 'First-Aid Kits for Elderly Neighbours',
    occasion: CircleOccasion.EMERGENCY_ASSISTANCE,
    story:
      'Twelve older neighbours urgently need stocked first-aid bags, basic health checks, emergency contacts, and transport support while their clinic restores supplies.',
    recipientName: 'Oke-Ado Senior Neighbours',
    recipientRelationship: 'other',
    recipientCity: 'Ibadan',
    targetAmount: 1_600_000,
    progressPercent: 66,
    supporterCount: 73,
    deadlineDays: 11,
    pexelsPhotoId: 5_125_690,
    coverAlt: 'A first-aid kit packed with emergency survival essentials',
  },
  {
    title: 'Emergency Transport for Rural Patients',
    occasion: CircleOccasion.EMERGENCY_ASSISTANCE,
    story:
      'A rural health network needs an emergency transport reserve so vulnerable patients can reach the nearest general hospital without dangerous delays.',
    recipientName: 'Nsukka Rural Health Network',
    recipientRelationship: 'other',
    recipientCity: 'Nsukka',
    targetAmount: 2_800_000,
    progressPercent: 45,
    supporterCount: 56,
    deadlineDays: 16,
    pexelsPhotoId: 6_647_018,
    coverAlt: 'A volunteer transporting emergency aid on a cart',
  },
  {
    title: 'Temporary Housing After a Family House Fire',
    occasion: CircleOccasion.EMERGENCY_ASSISTANCE,
    story:
      'The Edet family escaped a night fire but lost most belongings. Support will cover temporary housing, clothing, meals, documents, and basic household items.',
    recipientName: 'The Edet Family',
    recipientRelationship: 'family',
    recipientCity: 'Calabar',
    targetAmount: 2_200_000,
    progressPercent: 52,
    supporterCount: 67,
    deadlineDays: 13,
    pexelsPhotoId: 6_647_110,
    coverAlt: 'A volunteer packing emergency supplies for delivery',
  },
  {
    title: 'Community First-Aid and Rescue Kits',
    occasion: CircleOccasion.EMERGENCY_ASSISTANCE,
    story:
      'Equip six neighbourhood response teams with first-aid bags, torches, reflective vests, rain gear, megaphones, power banks, and rescue ropes.',
    recipientName: 'Minna Volunteer Responders',
    recipientRelationship: 'other',
    recipientCity: 'Minna',
    targetAmount: 3_100_000,
    progressPercent: 40,
    supporterCount: 48,
    deadlineDays: 20,
    pexelsPhotoId: 6_519_905,
    coverAlt: 'Hands applying a first-aid bandage in an emergency',
  },
  {
    title: 'Flood Relief for Makurdi Riverside Families',
    occasion: CircleOccasion.COMMUNITY_SUPPORT,
    story:
      'Riverside households need immediate food, clean water, hygiene kits, blankets, and transport to safe accommodation after floodwater entered their homes.',
    recipientName: 'Makurdi Riverside Families',
    recipientRelationship: 'other',
    recipientCity: 'Makurdi',
    targetAmount: 4_500_000,
    progressPercent: 51,
    supporterCount: 119,
    deadlineDays: 14,
    pexelsPhotoId: 33_329_471,
    coverAlt: 'People moving carefully through a flood-affected community',
  },
  {
    title: 'Rebuild Homes After Bayelsa Flooding',
    occasion: CircleOccasion.COMMUNITY_SUPPORT,
    story:
      'This community rebuild will supply roofing sheets, timber, cement, doors, and skilled labour for vulnerable households whose homes were damaged by flooding.',
    recipientName: 'Bayelsa Rebuild Collective',
    recipientRelationship: 'other',
    recipientCity: 'Yenagoa',
    targetAmount: 8_000_000,
    progressPercent: 36,
    supporterCount: 132,
    deadlineDays: 42,
    pexelsPhotoId: 13_455_948,
    coverAlt: 'Floodwater surrounding homes and community streets',
  },
  {
    title: 'Clean Water for Lokoja Flood Survivors',
    occasion: CircleOccasion.COMMUNITY_SUPPORT,
    story:
      'Help volunteers deliver bottled water, purification tablets, storage containers, and mobile filtration support to families cut off by contaminated floodwater.',
    recipientName: 'Lokoja Flood Survivors',
    recipientRelationship: 'other',
    recipientCity: 'Lokoja',
    targetAmount: 3_200_000,
    progressPercent: 64,
    supporterCount: 145,
    deadlineDays: 12,
    pexelsPhotoId: 33_329_474,
    coverAlt: 'Residents navigating deep water after a community flood',
  },
  {
    title: 'School Recovery After Ibadan Flooding',
    occasion: CircleOccasion.COMMUNITY_SUPPORT,
    story:
      'A primary school needs deep cleaning, replacement desks, books, teaching materials, and electrical repairs before children can safely return to class.',
    recipientName: 'Ona-Ara Community School',
    recipientRelationship: 'other',
    recipientCity: 'Ibadan',
    targetAmount: 5_500_000,
    progressPercent: 28,
    supporterCount: 74,
    deadlineDays: 34,
    pexelsPhotoId: 38_551_003,
    coverAlt: 'A waterlogged neighbourhood affected by severe flooding',
  },
  {
    title: 'Emergency Food for Yenagoa Communities',
    occasion: CircleOccasion.COMMUNITY_SUPPORT,
    story:
      'Local teams are preparing emergency food packs for 100 flood-affected households, with special provisions for babies, older residents, and nursing mothers.',
    recipientName: 'Yenagoa Flood Response Team',
    recipientRelationship: 'other',
    recipientCity: 'Yenagoa',
    targetAmount: 5_000_000,
    progressPercent: 57,
    supporterCount: 158,
    deadlineDays: 10,
    pexelsPhotoId: 36_312_787,
    coverAlt: 'A flooded community receiving urgent relief support',
  },
  {
    title: 'Bedding for Families Displaced by Floods',
    occasion: CircleOccasion.COMMUNITY_SUPPORT,
    story:
      'Displaced families sleeping in a community hall urgently need mattresses, sheets, mosquito nets, blankets, towels, and rechargeable lamps.',
    recipientName: 'Ahoada Displaced Families',
    recipientRelationship: 'other',
    recipientCity: 'Ahoada',
    targetAmount: 3_750_000,
    progressPercent: 48,
    supporterCount: 103,
    deadlineDays: 15,
    pexelsPhotoId: 29_251_256,
    coverAlt: 'Residents walking together through a flooded area',
  },
  {
    title: 'Restore Small Shops After Lagos Flooding',
    occasion: CircleOccasion.COMMUNITY_SUPPORT,
    story:
      'Neighbourhood kiosks lost stock and equipment when floodwater swept through. Small recovery grants will help traders clean, repair, and reopen their livelihoods.',
    recipientName: 'Lagos Island Small Traders',
    recipientRelationship: 'other',
    recipientCity: 'Lagos',
    targetAmount: 6_500_000,
    progressPercent: 32,
    supporterCount: 89,
    deadlineDays: 37,
    pexelsPhotoId: 14_823_611,
    coverAlt: 'Floodwater affecting a busy residential and trading area',
  },
  {
    title: 'Sanitation Kits for Anambra River Communities',
    occasion: CircleOccasion.COMMUNITY_SUPPORT,
    story:
      'Reduce illness after flooding with soap, disinfectant, buckets, sanitary products, gloves, water-treatment tablets, and safe-waste supplies for 80 homes.',
    recipientName: 'Anambra River Communities',
    recipientRelationship: 'other',
    recipientCity: 'Onitsha',
    targetAmount: 3_600_000,
    progressPercent: 54,
    supporterCount: 127,
    deadlineDays: 17,
    pexelsPhotoId: 14_823_614,
    coverAlt: 'Community members coping with high floodwater',
  },
  {
    title: 'Support Farmers Hit by Niger Floods',
    occasion: CircleOccasion.COMMUNITY_SUPPORT,
    story:
      'Smallholder farmers lost stored grain, tools, and seedlings. This recovery circle will provide food now and farm inputs for the next planting window.',
    recipientName: 'Niger Smallholder Farmers',
    recipientRelationship: 'other',
    recipientCity: 'Bida',
    targetAmount: 7_200_000,
    progressPercent: 26,
    supporterCount: 81,
    deadlineDays: 45,
    pexelsPhotoId: 35_302_180,
    coverAlt: 'People walking through a street covered by floodwater',
  },
  {
    title: 'Community Cleanup After Port Harcourt Floods',
    occasion: CircleOccasion.COMMUNITY_SUPPORT,
    story:
      'Volunteers need boots, gloves, shovels, wheelbarrows, disinfectant, refuse bags, meals, and vehicle hire for a coordinated post-flood cleanup.',
    recipientName: 'Port Harcourt Cleanup Volunteers',
    recipientRelationship: 'other',
    recipientCity: 'Port Harcourt',
    targetAmount: 2_900_000,
    progressPercent: 68,
    supporterCount: 139,
    deadlineDays: 13,
    pexelsPhotoId: 36_213_646,
    coverAlt: 'A community street inundated after heavy rainfall',
  },
  {
    title: 'Temporary Shelters for Delta Flood Victims',
    occasion: CircleOccasion.COMMUNITY_SUPPORT,
    story:
      'Provide weatherproof tarpaulins, timber frames, mats, solar lamps, cooking kits, and privacy screens for households waiting to return home.',
    recipientName: 'Delta Flood-Affected Households',
    recipientRelationship: 'other',
    recipientCity: 'Asaba',
    targetAmount: 6_000_000,
    progressPercent: 43,
    supporterCount: 111,
    deadlineDays: 25,
    pexelsPhotoId: 33_779_953,
    coverAlt: 'Homes and roads surrounded by widespread floodwater',
  },
  {
    title: 'Help Benue Families Return Home After Flooding',
    occasion: CircleOccasion.COMMUNITY_SUPPORT,
    story:
      'Families returning after the water recedes need cleaning supplies, minor repairs, replacement cooking items, food staples, and safe transport home.',
    recipientName: 'Benue Returning Families',
    recipientRelationship: 'other',
    recipientCity: 'Gboko',
    targetAmount: 4_250_000,
    progressPercent: 61,
    supporterCount: 134,
    deadlineDays: 22,
    pexelsPhotoId: 28_447_792,
    coverAlt: 'Residents working together in a flood-affected neighbourhood',
  },
];

export const seedSlug = (title: string): string =>
  `seed-${title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;

export const pexelsImageUrl = (photoId: number): string =>
  `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1600&h=900`;

export const buildCircleSeeds = (
  organizerId: string,
  now = new Date(),
): QueryDeepPartialEntity<Circle>[] =>
  circleSeedDefinitions.map((seed, index) => ({
    organizerId,
    slug: seedSlug(seed.title),
    title: seed.title,
    occasion: seed.occasion,
    story: seed.story,
    recipientName: seed.recipientName,
    recipientRelationship: seed.recipientRelationship,
    recipientCity: seed.recipientCity,
    recipientCountryCode: 'NG',
    recipientEmail: null,
    recipientPhone: null,
    coverImageUrl: pexelsImageUrl(seed.pexelsPhotoId),
    coverAssetId: `pexels-${seed.pexelsPhotoId}`,
    coverAlt: seed.coverAlt,
    privacy: CirclePrivacy.COMMUNITY,
    status: CircleStatus.ACTIVE,
    targetAmount: seed.targetAmount.toFixed(2),
    amountRaised: Math.round(
      (seed.targetAmount * seed.progressPercent) / 100,
    ).toFixed(2),
    currency: 'NGN',
    fundingMode: 'cash',
    flexBufferPercent: 0,
    deadline: new Date(now.getTime() + seed.deadlineDays * DAY_IN_MS),
    deliveryAddress: null,
    deliveryCollectionMode: 'request_when_funded',
    allowGeneralContributions: true,
    supporterCount: seed.supporterCount,
    publishIdempotencyKey: null,
    isHidden: false,
    publishedAt: new Date(now.getTime() - ((index % 20) + 1) * DAY_IN_MS),
    completedAt: null,
    recipientTokenHash: null,
  }));

export async function seedCircles(dataSource = AppDataSource): Promise<number> {
  const shouldDestroy = !dataSource.isInitialized;
  if (shouldDestroy) {
    await dataSource.initialize();
  }

  try {
    return await dataSource.transaction(async (manager) => {
      const users = manager.getRepository(User);
      await users.upsert(
        {
          name: 'GiftCircle',
          email: SEED_ORGANIZER_EMAIL,
          passwordHash: null,
          googleId: null,
          avatarUrl: null,
          phone: null,
          country: 'Nigeria',
          currency: 'NGN',
          role: UserRole.USER,
          isSuspended: false,
          deletedAt: null,
        },
        ['email'],
      );

      const organizer = await users.findOneByOrFail({
        email: SEED_ORGANIZER_EMAIL,
      });
      const circles = buildCircleSeeds(organizer.id);

      await manager.getRepository(Circle).upsert(circles, {
        conflictPaths: ['slug'],
        skipUpdateIfNoValuesChanged: true,
      });

      return circles.length;
    });
  } finally {
    if (shouldDestroy && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

async function main(): Promise<void> {
  const count = await seedCircles();
  console.log(`Seeded ${count} community circles.`);
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    console.error('Unable to seed circles:', error);
    process.exitCode = 1;
  });
}
