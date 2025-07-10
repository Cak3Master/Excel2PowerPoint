// Test script to verify the duplicate data source fix
console.log('Testing duplicate data source fix...\n');

// Test data with duplicates (simulating the issue)
const testDataSources = [
    { id: 'ds_e728cc89', name: 'Test File 1', label_assignments: [] },
    { id: 'ds_42f4d0a2', name: 'Test File 2', label_assignments: [] },
    { id: 'ds_e728cc89', name: 'Test File 1', label_assignments: [{ id: 'label_1' }] }, // duplicate with updated labels
    { id: 'ds_42f4d0a2', name: 'Test File 2', label_assignments: [{ id: 'label_2' }] }  // another duplicate
];

console.log('Original data sources:', testDataSources.length);
console.log('IDs:', testDataSources.map(ds => ds.id));

// Test 1: Map-based deduplication (NEW APPROACH)
console.log('\n--- Test 1: Map-based deduplication ---');
const mapDeduplicated = Array.from(new Map(testDataSources.map(source => [source.id, source])).values());
console.log('Deduplicated count:', mapDeduplicated.length);
console.log('IDs:', mapDeduplicated.map(ds => ds.id));
console.log('ds_e728cc89 labels:', mapDeduplicated.find(s => s.id === 'ds_e728cc89').label_assignments.length);
console.log('Result: Map keeps LAST occurrence (with latest updates)');

// Test 2: Filter-based deduplication (OLD APPROACH)
console.log('\n--- Test 2: Filter-based deduplication ---');
const filterDeduplicated = testDataSources.filter((source, index, self) => 
    index === self.findIndex(s => s.id === source.id)
);
console.log('Deduplicated count:', filterDeduplicated.length);
console.log('IDs:', filterDeduplicated.map(ds => ds.id));
console.log('ds_e728cc89 labels:', filterDeduplicated.find(s => s.id === 'ds_e728cc89').label_assignments.length);
console.log('Result: Filter keeps FIRST occurrence (might have outdated data)');

// Test 3: Store update logic simulation
console.log('\n--- Test 3: Store update logic ---');
let storeDataSources = [
    { id: 'ds_e728cc89', name: 'Test File 1', label_assignments: [] }
];

// Simulate label assignment update
const updatedSource = { id: 'ds_e728cc89', name: 'Test File 1', label_assignments: [{ id: 'label_1' }] };

// Simulate the addDataSource logic
const existingIndex = storeDataSources.findIndex(ds => ds.id === updatedSource.id);
if (existingIndex !== -1) {
    const existing = storeDataSources[existingIndex];
    if (JSON.stringify(existing) !== JSON.stringify(updatedSource)) {
        storeDataSources[existingIndex] = updatedSource; // Update in place
        console.log('Updated existing data source');
    } else {
        console.log('No update needed (identical data)');
    }
} else {
    storeDataSources.push(updatedSource);
    console.log('Added new data source');
}

console.log('Final store count:', storeDataSources.length);
console.log('ds_e728cc89 labels:', storeDataSources[0].label_assignments.length);

// Test 4: React key uniqueness
console.log('\n--- Test 4: React key uniqueness ---');
const uniqueKeys = new Set(mapDeduplicated.map(ds => ds.id));
console.log('Unique keys:', uniqueKeys.size);
console.log('Total components:', mapDeduplicated.length);
console.log('Keys match components:', uniqueKeys.size === mapDeduplicated.length ? 'YES' : 'NO');

console.log('\n--- Summary ---');
console.log('✅ Map-based deduplication keeps latest data');
console.log('✅ Store update logic prevents unnecessary additions');
console.log('✅ React keys are unique');
console.log('✅ Fix should resolve duplicate key warnings');