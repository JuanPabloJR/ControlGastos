ionic start control-gastos blank --type=angular

cd control-gastos

# Instalar dependencias necesarias
npm install @ionic/storage-angular
npm install chart.js
npm install date-fns
npm install uuid
npm install @types/uuid --save-dev
npm install chart.js
npm install @capacitor/local-notifications

# Modo desarrollo (navegador)
ionic serve

# O compilar para Android
ionic capacitor add android
ionic capacitor build android
ionic capacitor open android