"""Pydantic model for the HormuzPT model state."""

from pydantic import BaseModel


class ModelState(BaseModel):
    """Full model state matching CLAUDE.md §3.1."""

    version: str = "2026-W11"
    updated_at: str = "2026-03-11T00:00:00Z"

    # Preços ERSE
    base_eff_gas: float = 1.850
    base_eff_die: float = 1.955
    pretax_gas: float = 0.847
    pretax_die: float = 1.090
    ext_gas: float = 0.550
    ext_die: float = 0.7744

    # Descontos
    disc_gas: float = 0.047
    disc_die: float = 0.093

    # Semana referência governo
    base_ref_eff_gas: float = 1.751
    base_ref_eff_die: float = 1.727
    base_ref_pump_gas: float = 1.704
    base_ref_pump_die: float = 1.633

    # Volumes semanais
    weekly_l_gas: float = 28_854_795
    weekly_l_die: float = 95_405_914

    # Fiscal
    vat_rate: float = 0.23
    temp_isp_die: float = 0.03553
    w1_off_die_disc: float = 0.0437

    # Cenários (multiplicadores)
    mult_gas: dict[str, float] = {"moderado": 1.20, "severo": 1.35, "extremo": 1.50}
    mult_die: dict[str, float] = {"moderado": 1.25, "severo": 1.45, "extremo": 1.65}

    # Elasticidades
    elast_gas: float = -0.20
    elast_die: float = -0.15

    # Gás natural / electricidade
    mibgas_spot: float | None = None
    omie_pt_avg: float | None = None
    gas_stress_mult: float = 1.15
    elec_gas_sensitivity: float = 0.35

    # Mix energético
    mix_petroleum: float = 0.415
    mix_gas: float = 0.185
    mix_renewables: float = 0.182
    mix_biomass: float = 0.160
    mix_other: float = 0.058
