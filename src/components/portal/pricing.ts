import { BookingFormData, PackageType, PriceBreakdownItem, getDuracionHoras } from './types';

export interface BookingPricingResult {
  subtotal: number;
  deposito: number;
  balance: number;
  duracionHoras: number;
  itemsDesglose: PriceBreakdownItem[];
}

export function calculateBookingPricing(params: {
  selectedPackage: PackageType | null;
  servicios: BookingFormData['servicios'];
  horaInicio: string;
  horaSalida: string;
  incluirBeatExclusivoBadlenz: boolean;
  vipDescuentoAplicado: 'VIP' | 'CREW' | null;
}): BookingPricingResult {
  const {
    selectedPackage,
    servicios,
    horaInicio,
    horaSalida,
    incluirBeatExclusivoBadlenz,
    vipDescuentoAplicado,
  } = params;

  const durH = getDuracionHoras(horaInicio, horaSalida);

  let baseSub = 0;
  let baseDep = 0;
  let baseBal = 0;
  let baseItems: PriceBreakdownItem[] = [];

  const isPromoPkg =
    selectedPackage === 'promo' ||
    (selectedPackage === null &&
      servicios.grabacion &&
      servicios.mezclaMaster &&
      !servicios.instrumental &&
      !servicios.produccionCompleta &&
      durH === 4);

  if (isPromoPkg) {
    baseSub = 130;
    baseDep = 50;
    baseBal = 80;
    baseItems = [
      { name: '🎤 Grabación de Voces (4h de sesión con Badlenz)', price: 120 },
      { name: '🎚️ Mezcla & Master Comercial Completo', price: 80 },
      { name: '🔥 Descuento Promo Reapertura 35% OFF (Cupo oficial 1 de 6)', price: -70, isDiscount: true },
    ];
  } else if (
    selectedPackage === 'pro' ||
    (selectedPackage === null &&
      servicios.grabacion &&
      servicios.mezclaMaster &&
      !servicios.instrumental &&
      !servicios.produccionCompleta &&
      durH === 5)
  ) {
    baseSub = 200;
    baseDep = 50;
    baseBal = 150;
    baseItems = [
      { name: '🎤 Grabación de Voces Pro (4-5h de sesión)', price: 150 },
      { name: '🎚️ Mezcla & Master Comercial', price: 100 },
      { name: '🔥 Descuento Combo Oficial "Grabación + Mix + Master"', price: -50, isDiscount: true },
    ];
  } else if (
    selectedPackage === 'full' ||
    (servicios.instrumental && servicios.grabacion && servicios.mezclaMaster && durH >= 4)
  ) {
    baseSub = 350;
    baseDep = 175;
    baseBal = 175;
    baseItems = [
      { name: '🎹 Beat Exclusivo Prod. Badlenz', price: 150 },
      { name: '🎤 Grabación de Voces (4-5h de sesión)', price: 150 },
      { name: '🎚️ Mezcla & Master Comercial', price: 100 },
      { name: '★ Descuento Combo "Producción Integral"', price: -50, isDiscount: true },
    ];
  } else if (
    selectedPackage === 'mezcla' ||
    (!servicios.grabacion && !servicios.instrumental && servicios.mezclaMaster && !servicios.produccionCompleta)
  ) {
    baseSub = 150;
    baseDep = 75;
    baseBal = 75;
    baseItems = [
      { name: '🎚️ Mezcla Profesional Multitrack & Afinación', price: 100 },
      { name: '🔊 Masterización Comercial (Estándar Streaming)', price: 50 },
    ];
  } else if (
    selectedPackage === 'instrumental' ||
    (!servicios.grabacion && servicios.instrumental && !servicios.mezclaMaster && !servicios.produccionCompleta)
  ) {
    baseSub = 200;
    baseDep = 100;
    baseBal = 100;
    baseItems = [{ name: '🎹 Instrumental Exclusiva a Medida (Prod. Badlenz)', price: 200 }];
  } else if (
    selectedPackage === 'express' ||
    (servicios.grabacion && !servicios.mezclaMaster && !servicios.instrumental && !servicios.produccionCompleta && durH === 3)
  ) {
    baseSub = 165;
    baseDep = 50;
    baseBal = 115;
    baseItems = [{ name: '🎤 Grabación & Pre-mezcla (3h de sesión)', price: 165 }];
  } else if (selectedPackage === 'combo_3') {
    let comboPrice = 425;
    let desc = -175;
    if (vipDescuentoAplicado === 'VIP') {
      comboPrice = 375;
      desc = -225;
    } else if (vipDescuentoAplicado === 'CREW') {
      comboPrice = 300;
      desc = -300;
    }
    baseSub = comboPrice;
    baseDep = Math.round(comboPrice * 0.5);
    baseBal = comboPrice - baseDep;
    baseItems = [
      {
        name: `🎵 3 Canciones Completas (Grabación, Mezcla & Master ${vipDescuentoAplicado ? `[Tarifa ${vipDescuentoAplicado}]` : ''})`,
        price: 600,
      },
      { name: '★ Ahorro Especial Pack 3 Canciones', price: desc, isDiscount: true },
    ];
  } else if (selectedPackage === 'combo_4') {
    let comboPrice = 550;
    let desc = -250;
    if (vipDescuentoAplicado === 'VIP') {
      comboPrice = 480;
      desc = -320;
    } else if (vipDescuentoAplicado === 'CREW') {
      comboPrice = 375;
      desc = -425;
    }
    baseSub = comboPrice;
    baseDep = Math.round(comboPrice * 0.5);
    baseBal = comboPrice - baseDep;
    baseItems = [
      {
        name: `🎵 4 Canciones Completas (Grabación, Mezcla & Master ${vipDescuentoAplicado ? `[Tarifa ${vipDescuentoAplicado}]` : ''})`,
        price: 800,
      },
      { name: '★ Ahorro Especial Pack 4 Canciones', price: desc, isDiscount: true },
    ];
  } else if (selectedPackage === 'prod_cuarto') {
    const hrs = Math.max(3, durH);
    baseSub = hrs * 35;
    baseDep = 50;
    baseBal = baseSub - baseDep;
    baseItems = [{ name: `🎧 Solo Cuarto / Beatmaking (${hrs}h @ $35/h)`, price: baseSub }];
  } else if (selectedPackage === 'prod_artista') {
    const hrs = Math.max(2, durH);
    baseSub = hrs * 50;
    baseDep = 50;
    baseBal = baseSub - baseDep;
    baseItems = [{ name: `🎙️ Studio + Control Room para Productor (${hrs}h @ $50/h)`, price: baseSub }];
  } else if (selectedPackage === 'prod_eng') {
    const hrs = Math.max(2, durH);
    baseSub = hrs * 75;
    baseDep = 50;
    baseBal = baseSub - baseDep;
    baseItems = [{ name: `🎛️ Sesión de Grabación Asistida con Badlenz (${hrs}h @ $75/h)`, price: baseSub }];
  } else {
    let sub = 0;
    const items: PriceBreakdownItem[] = [];
    if (servicios.produccionCompleta) {
      sub += 350;
      items.push({ name: '📀 Producción Integral Completa', price: 350 });
    } else {
      if (servicios.grabacion) {
        const grabPrice = durH * 30;
        sub += grabPrice;
        items.push({ name: `🎤 Grabación (${durH}h @ $30/h)`, price: grabPrice });
      }
      if (servicios.instrumental) {
        sub += 150;
        items.push({ name: '🎹 Beat / Instrumental Original', price: 150 });
      }
      if (servicios.mezclaMaster) {
        sub += 100;
        items.push({ name: '🎚️ Mezcla & Mastering', price: 100 });
      }
    }
    baseSub = sub;
    baseDep = Math.round(sub * 0.5 * 100) / 100;
    baseBal = Math.round((sub - baseDep) * 100) / 100;
    baseItems = items;
  }

  let finalSub = baseSub;
  let finalDep = baseDep;
  let finalBal = baseBal;
  const finalItems = [...baseItems];

  if (incluirBeatExclusivoBadlenz) {
    finalSub += 125;
    finalDep = Math.round((finalDep + 62.5) * 100) / 100;
    finalBal = Math.round((finalSub - finalDep) * 100) / 100;
    finalItems.push(
      { name: '🎹 Beat Exclusivo Prod. Badlenz (Estilo Bad Bunny / Reggaetón)', price: 175 },
      { name: '🔥 Descuento Combo Beat Exclusivo (-$50)', price: -50, isDiscount: true }
    );
  }

  return {
    subtotal: finalSub,
    deposito: finalDep,
    balance: finalBal,
    duracionHoras: durH,
    itemsDesglose: finalItems,
  };
}
