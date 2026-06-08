-- ================================================================
-- LANMOU DOUVAN — Écriture ROBUSTE de l'état (optionnel mais recommandé)
-- ================================================================
--
-- POURQUOI : par défaut, l'app écrit en envoyant TOUT le blob JSON
-- (upsert). Si deux appareils sauvegardent presque en même temps, le
-- dernier écrase l'autre. Le correctif côté client fusionne déjà par
-- section, mais cette fonction fait la même fusion CÔTÉ SERVEUR, avec un
-- verrou de ligne → aucune perte possible, même en cas de course réseau.
--
-- PRÉREQUIS : avoir lancé setup.sql d'abord.
--
-- COMMENT L'UTILISER ENSUITE (1 ligne dans app.js → sbSave) :
--   await sb.rpc('save_app_state', { p_data: d, p_device: DEVICE_ID });
--   (au lieu de  sb.from('app_state').upsert({...})  )
-- La lecture (entrée) ne change pas : select('data').eq('id','main').
-- ================================================================

CREATE OR REPLACE FUNCTION save_app_state(p_data jsonb, p_device text DEFAULT '')
RETURNS jsonb
LANGUAGE plpgsql
<<<<<<< HEAD
=======
SET search_path = public
>>>>>>> b9734e8171d5d8554cbd0ebbb98f63c9b19513e8
AS $$
DECLARE
  cur        jsonb;
  merged     jsonb;
  ct         jsonb;   -- cur._t  (horodatages par section, côté serveur)
  pt         jsonb;   -- p_data._t (horodatages par section, entrant)
  merged_t   jsonb;
  k          text;
  seg        text[];
  cts        text;
  pts        text;
BEGIN
  -- Verrou : sérialise les écritures concurrentes sur la ligne 'main'.
  SELECT data INTO cur FROM app_state WHERE id = 'main' FOR UPDATE;

  -- Première écriture : rien à fusionner.
  IF cur IS NULL THEN
    INSERT INTO app_state (id, data, updated_at, device_id)
    VALUES ('main', p_data, NOW(), p_device);
    RETURN p_data;
  END IF;

  merged   := cur;
  ct       := COALESCE(cur->'_t',    '{}'::jsonb);
  pt       := COALESCE(p_data->'_t', '{}'::jsonb);
  merged_t := ct;

  -- Pour chaque section horodatée dans l'entrant : si elle est plus récente
  -- que la version serveur, on la prend (sinon on garde le serveur).
  FOR k IN SELECT jsonb_object_keys(pt) LOOP
    pts := pt->>k;
    cts := ct->>k;
    IF pts IS NOT NULL AND pts <> '' AND (cts IS NULL OR cts = '' OR pts > cts) THEN
      seg      := string_to_array(k, '.');                                   -- ex: {couple,planning}
      merged   := jsonb_set(merged, seg, COALESCE(p_data #> seg, 'null'::jsonb), true);
      merged_t := jsonb_set(merged_t, ARRAY[k], to_jsonb(pts), true);
    END IF;
  END LOOP;

  merged := jsonb_set(merged, '{_t}', merged_t, true);

  -- updatedAt global = le plus récent des deux (chaînes ISO triables).
  merged := jsonb_set(
    merged, '{updatedAt}',
    to_jsonb(GREATEST(COALESCE(cur->>'updatedAt',''), COALESCE(p_data->>'updatedAt','')))
  , true);

  UPDATE app_state
  SET    data = merged, updated_at = NOW(), device_id = p_device
  WHERE  id = 'main';

  RETURN merged;
END;
$$;

COMMENT ON FUNCTION save_app_state(jsonb, text) IS
  'Écriture robuste : fusionne l''état entrant avec l''état serveur section par section (newest-wins via data._t), sous verrou de ligne. Évite toute perte en édition simultanée.';

-- Droit d'appel via la clé anon (comme le reste de l'app).
GRANT EXECUTE ON FUNCTION save_app_state(jsonb, text) TO anon, authenticated;
