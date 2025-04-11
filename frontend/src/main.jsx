import { createRoot } from 'react-dom/client';

import RootApp from './RootApp';
import { SheetJSFT } from 'sheetjs-style';

console.log("SheetJSFT in index.js:", SheetJSFT); 

const root = createRoot(document.getElementById('root'));
root.render(<RootApp />);
