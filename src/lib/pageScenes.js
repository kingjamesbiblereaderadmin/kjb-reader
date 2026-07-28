// Full-bleed themed scene image per app route.
// Pages render their content over these via <SceneBackground> in AppLayout.
const BASE = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8';

export const PAGE_SCENES = {
  '/':               `${BASE}/b66bc9a47_generated_image.png`, // home — reading nook
  '/read':           `${BASE}/eb4557526_generated_image.png`, // read — open Bible on desk
  '/contents':       `${BASE}/268508a61_generated_image.png`, // contents — library
  '/resources':      `${BASE}/b5c969cca_generated_image.png`, // resources — study desk
  '/about':          `${BASE}/1d7d09761_generated_image.png`, // about — journal desk
  '/settings':       `${BASE}/1615b8f5f_generated_image.png`, // settings — workbench
  '/search':         `${BASE}/ea45cf573_generated_image.png`, // search — detective desk
  '/advanced-search':`${BASE}/c4bc01cf9_generated_image.png`, // advanced search — research
  '/saved':          `${BASE}/24ee40fff_generated_image.png`, // saved — drawer
};

export function sceneFor(pathname) {
  return PAGE_SCENES[pathname];
}