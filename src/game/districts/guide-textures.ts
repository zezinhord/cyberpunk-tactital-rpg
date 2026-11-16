/** Contatos principais: somente a textura do distrito atual é pré-carregada. */
import type {DistrictId} from "./catalog";
export const DISTRICT_GUIDE_TEXTURE:Readonly<Record<DistrictId,string>>={
 aurea:"npc-celina",subsolo:"npc-mara","setor-zero":"npc-iuri",
 prisma:"npc-kai",periferia:"npc-dara",
};
