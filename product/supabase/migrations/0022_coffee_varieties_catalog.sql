BEGIN;

CREATE TABLE coffee_varieties (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL UNIQUE,
    sort_order integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT coffee_varieties_sort_order_unique UNIQUE (sort_order)
);

CREATE TABLE coffee_variety_assignments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    coffee_id uuid NOT NULL REFERENCES coffees(id) ON DELETE CASCADE,
    variety_id uuid NOT NULL REFERENCES coffee_varieties(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT coffee_variety_assignments_unique UNIQUE (coffee_id, variety_id)
);

CREATE INDEX coffee_variety_assignments_variety_idx
    ON coffee_variety_assignments (variety_id, coffee_id);

INSERT INTO coffee_varieties (name, sort_order) VALUES
    ('AB3 Java', 1),
    ('Anacafe 14 Catimor', 2),
    ('Batian', 3),
    ('Bourbon', 4),
    ('Bourbon Mayaguez 139 BM139', 5),
    ('Bourbon Mayaguez 71 BM71', 6),
    ('BPL10 Java', 7),
    ('Caripe Criollo Cogollo Verde, Buonaffina', 8),
    ('Casiopea', 9),
    ('Catigua MG2', 10),
    ('Catimor 129 Cat129, Nyika', 11),
    ('Catisic Catimor', 12),
    ('Catuai', 13),
    ('Caturra', 14),
    ('Centroamericano H1', 15),
    ('Costa Rica 95 Catimor', 16),
    ('Cuscatleco Sarchimor', 17),
    ('EC15 MundoMex', 18),
    ('Esperanza L4 A5', 19),
    ('Evaluna EC18', 20),
    ('Fronton Catimor', 21),
    ('Geisha (Panama) Gesha', 22),
    ('H3', 23),
    ('Harar Rwanda Harar or Harraghe', 24),
    ('IAPAR 59 Sarchimor', 25),
    ('IHCAFE 90 Catimor', 26),
    ('IPR 103', 27),
    ('IPR 107', 28),
    ('Jackson 2/1257 Jackson', 29),
    ('Java', 30),
    ('K7', 31),
    ('Kartika 1', 32),
    ('KP423', 33),
    ('Lempira Catimor', 34),
    ('Limani Sarchimor', 35),
    ('Maragogipe', 36),
    ('Marsellesa Sarchimor', 37),
    ('Mibirizi', 38),
    ('Milenio H10', 39),
    ('Monte Claro Ombligon, Lechocita', 40),
    ('Mundo Maya EC16', 41),
    ('Mundo Novo', 42),
    ('Nayarita EC19', 43),
    ('Nemaya (Coffea canephora) Rootstock', 44),
    ('Nyasaland Bugisu local, Nyasa', 45),
    ('Obata (Red) Sarchimor', 46),
    ('Oro Azteca Catimor', 47),
    ('Pacamara', 48),
    ('Pacas', 49),
    ('Pache', 50),
    ('Parainema Sarchimor', 51),
    ('Paraiso', 52),
    ('Pop3303/21', 53),
    ('RAB C15', 54),
    ('Ruiru 11', 55),
    ('S4808', 56),
    ('S795 Selection 3', 57),
    ('SL14', 58),
    ('SL28', 59),
    ('SL34', 60),
    ('Sln.5B S.2931', 61),
    ('Sln.6 S.2828', 62),
    ('Starmaya', 63),
    ('T5175 Catimor', 64),
    ('T5296 Sarchimor', 65),
    ('T8667 Catimor', 66),
    ('Tekisic Improved Bourbon', 67),
    ('Typica', 68),
    ('Venecia', 69),
    ('Villa Sarchi', 70);

INSERT INTO coffee_variety_assignments (coffee_id, variety_id)
SELECT coffees.id, coffee_varieties.id
FROM coffees
JOIN coffee_varieties ON coffee_varieties.name = coffees.variety
WHERE coffees.variety IS NOT NULL
ON CONFLICT (coffee_id, variety_id) DO NOTHING;

COMMIT;
