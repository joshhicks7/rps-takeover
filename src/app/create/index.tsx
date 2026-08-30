import { Redirect } from 'expo-router';
import { useState } from 'react';

export default function CreateIndex() {
  const [id] = useState(() => `lvl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`);
  return <Redirect href={`/create/${id}`} />;
}
