import {
  BufferGeometry, CatmullRomCurve3, Color, CylinderGeometry, ExtrudeGeometry,
  Float32BufferAttribute, Group, IcosahedronGeometry, LatheGeometry, Mesh,
  MeshStandardMaterial, Shape, SphereGeometry, Vector2, Vector3,
} from '@iwsdk/core';

/** Original miniature. Metres; +Y up, front -Z, plinth contacts y=0. */
export function createGarden(): Group {
  const garden = new Group();
  garden.name = 'StillspaceGarden';
  const material = (color: string, roughness = 0.85) => new MeshStandardMaterial({ color, roughness });
  const ceramic = material('#e8e1d1', 0.55);
  const rim = material('#f8f0df', 0.65);
  const underside = material('#c1b9a8');
  const moss = material('#a0af8a');
  const bark = material('#6c6550');
  const terracotta = material('#c67c61', 0.7);
  const limestone = material('#eee4cd');
  const rockMaterial = material('#96998d');
  const foliage = ['#7e967b', '#91a58a', '#aab99b', '#b6c3a8'].map((color) => material(color));
  const leafShape = new IcosahedronGeometry(1, 2);
  const stoneShape = new IcosahedronGeometry(1, 1);

  function mesh(name: string, geometry: BufferGeometry, surface: MeshStandardMaterial, parent = garden): Mesh {
    const object = new Mesh(geometry, surface);
    object.name = name;
    object.castShadow = false;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }

  // A continuous turned profile gives the little island a tactile, rounded edge.
  const profile = [
    [0, 0], [0.58, 0], [0.611, 0.008], [0.637, 0.022],
    [0.65, 0.039], [0.65, 0.071], [0.641, 0.091],
    [0.624, 0.103], [0.6, 0.109], [0, 0.109],
  ].map(([x, y]) => new Vector2(x, y));
  mesh('TurnedCreamPlinth', new LatheGeometry(profile, 72), ceramic);
  const foot = mesh('RecessedStoneFoot', new CylinderGeometry(0.565, 0.55, 0.012, 64), underside);
  foot.position.y = 0.006;
  const lip = mesh('IvoryInsetLip', new CylinderGeometry(0.607, 0.607, 0.009, 72), rim);
  lip.position.y = 0.11;

  function groundY(x: number, z: number): number {
    const r = Math.sqrt(x * x + z * z);
    const edge = Math.max(0, 1 - (r / 0.595) ** 6);
    const leftHill = 0.058 * Math.exp(-((x + 0.23) ** 2 + (z + 0.09) ** 2) / 0.082);
    const rightHill = 0.036 * Math.exp(-((x - 0.31) ** 2 + (z - 0.06) ** 2) / 0.046);
    return 0.115 + edge * (0.018 + leftHill + rightHill);
  }

  const positions: number[] = [0, groundY(0, 0), 0];
  const indices: number[] = [];
  const centerColor = new Color('#a8b697');
  const colors: number[] = [centerColor.r, centerColor.g, centerColor.b];
  const rings = 16;
  const segments = 72;
  for (let ring = 1; ring <= rings; ring++) {
    const radius = (ring / rings) * 0.595;
    for (let segment = 0; segment <= segments; segment++) {
      const a = (segment / segments) * Math.PI * 2;
      const x = Math.cos(a) * radius;
      const z = Math.sin(a) * radius;
      positions.push(x, groundY(x, z), z);
      const tint = new Color('#a8b697').lerp(new Color('#d0d5b9'), (Math.sin(x * 7 + z * 4) + 1) * 0.13);
      colors.push(tint.r, tint.g, tint.b);
      if (segment < segments) {
        const i = 1 + (ring - 1) * (segments + 1) + segment;
        if (ring === 1) indices.push(0, i + 1, i);
        if (ring < rings) indices.push(i, i + 1, i + segments + 1, i + 1, i + segments + 2, i + segments + 1);
      }
    }
  }
  const terrainGeometry = new BufferGeometry();
  terrainGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  terrainGeometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  terrainGeometry.setIndex(indices);
  terrainGeometry.computeVertexNormals();
  const mossSurface = moss.clone();
  mossSurface.vertexColors = true;
  mesh('RollingMossSurface', terrainGeometry, mossSurface);

  function pebble(name: string, x: number, z: number, size: number, surface = limestone): Mesh {
    const stone = mesh(name, stoneShape, surface);
    stone.scale.set(size, size * 0.33, size * 0.73);
    stone.position.set(x, groundY(x, z) + size * 0.21, z);
    stone.rotation.y = x * 9 + z * 3;
    return stone;
  }

  // The path is individually seated on the sampled moss, including on the slopes.
  const path = new CatmullRomCurve3([
    new Vector3(-0.43, 0, 0.35), new Vector3(-0.24, 0, 0.26),
    new Vector3(0.02, 0, 0.26), new Vector3(0.21, 0, 0.13), new Vector3(0.30, 0, -0.18),
  ]);
  for (let i = 0; i < 12; i++) {
    const p = path.getPoint(i / 11);
    pebble(`PathStone${i + 1}`, p.x, p.z, 0.04 + Math.sin(i * 2.1) * 0.004);
  }

  const arch = new Group();
  arch.name = 'TerracottaPortal';
  arch.position.set(0.29, groundY(0.29, -0.095), -0.095);
  arch.rotation.y = -0.18;
  garden.add(arch);
  const archShape = new Shape();
  archShape.moveTo(-0.115, 0);
  archShape.lineTo(-0.115, 0.18);
  archShape.absarc(0, 0.18, 0.115, Math.PI, 0, true);
  archShape.lineTo(0.115, 0);
  archShape.lineTo(0.071, 0);
  archShape.lineTo(0.071, 0.18);
  archShape.absarc(0, 0.18, 0.071, 0, Math.PI, false);
  archShape.lineTo(-0.071, 0);
  archShape.closePath();
  const archMesh = mesh('SolidSculpturalArch', new ExtrudeGeometry(archShape, {
    depth: 0.058, bevelEnabled: true, bevelSegments: 3,
    steps: 1, bevelSize: 0.006, bevelThickness: 0.006, curveSegments: 18,
  }), terracotta, arch);
  archMesh.position.z = -0.029;
  archMesh.castShadow = true;

  const tree = new Group();
  tree.name = 'CloudCanopyTree';
  tree.position.set(-0.19, groundY(-0.19, -0.12) - 0.006, -0.12);
  garden.add(tree);

  function branch(name: string, points: number[][], radius: number, endRadius: number): void {
    const curve = new CatmullRomCurve3(points.map(([x, y, z]) => new Vector3(x, y, z)));
    const sections = 12;
    const sides = 8;
    const frames = curve.computeFrenetFrames(sections, false);
    const vertices: number[] = [];
    const faces: number[] = [];
    for (let i = 0; i <= sections; i++) {
      const center = curve.getPoint(i / sections);
      const r = radius + (endRadius - radius) * (i / sections);
      for (let j = 0; j <= sides; j++) {
        const a = (j / sides) * Math.PI * 2;
        const p = center.clone()
          .addScaledVector(frames.normals[i], Math.cos(a) * r)
          .addScaledVector(frames.binormals[i], Math.sin(a) * r);
        vertices.push(p.x, p.y, p.z);
        if (i < sections && j < sides) {
          const n = i * (sides + 1) + j;
          faces.push(n, n + 1, n + sides + 1, n + 1, n + sides + 2, n + sides + 1);
        }
      }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geometry.setIndex(faces);
    geometry.computeVertexNormals();
    mesh(name, geometry, bark, tree);
  }

  branch('CurvedMainTrunk', [[0, 0, 0], [-0.027, 0.16, 0], [0.015, 0.31, -0.01], [-0.015, 0.48, 0.005]], 0.035, 0.012);
  branch('LeftSupportingBough', [[-0.007, 0.22, 0], [-0.11, 0.29, 0.006], [-0.20, 0.34, 0.015]], 0.022, 0.008);
  branch('RightSupportingBough', [[0.009, 0.31, -0.01], [0.11, 0.38, -0.015], [0.16, 0.42, -0.005]], 0.019, 0.007);
  branch('RearSupportingBough', [[0, 0.30, -0.01], [-0.02, 0.39, -0.105], [-0.04, 0.45, -0.13]], 0.017, 0.006);
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 0.4;
    branch(`RootFlare${i + 1}`, [[0, 0.035, 0], [Math.cos(a) * 0.038, 0.012, Math.sin(a) * 0.038], [Math.cos(a) * 0.065, 0.002, Math.sin(a) * 0.065]], 0.014, 0.003);
  }

  const clouds = [
    [-0.20, 0.355, 0.015, 0.15, 0.085, 0.13], [-0.115, 0.385, 0.055, 0.145, 0.09, 0.13],
    [0.15, 0.44, -0.005, 0.16, 0.095, 0.13], [0.055, 0.47, 0.015, 0.145, 0.095, 0.14],
    [-0.07, 0.49, -0.12, 0.15, 0.095, 0.13], [-0.01, 0.535, 0.005, 0.18, 0.11, 0.15],
    [-0.10, 0.52, 0.065, 0.125, 0.075, 0.12], [0.10, 0.53, -0.07, 0.12, 0.075, 0.105],
  ];
  clouds.forEach(([x, y, z, sx, sy, sz], i) => {
    const canopy = mesh(`SculptedCanopyCloud${i + 1}`, leafShape, foliage[i % foliage.length], tree);
    canopy.position.set(x, y, z);
    canopy.scale.set(sx, sy, sz);
    canopy.rotation.y = i * 0.79;
    canopy.castShadow = true;
  });

  const shrubs = [[-0.35, 0.21, 0.09], [0.37, 0.23, 0.075], [0.12, -0.38, 0.07]];
  shrubs.forEach(([x, z, size], i) => {
    const shrub = mesh(`GroundedShrub${i + 1}`, leafShape, foliage[(i + 1) % foliage.length]);
    shrub.position.set(x, groundY(x, z) + size * 0.37, z);
    shrub.scale.set(size, size * 0.65, size * 0.78);
  });
  pebble('WeatheredRockOne', 0.40, -0.27, 0.078, rockMaterial);
  pebble('WeatheredRockTwo', 0.45, -0.19, 0.047, rockMaterial);
  pebble('WeatheredRockThree', -0.43, -0.23, 0.065, rockMaterial);
  pebble('WeatheredRockFour', -0.37, -0.31, 0.039, rockMaterial);
  garden.userData.modelContract = { contactPlane: 0, radius: 0.65, up: '+Y', front: '-Z' };
  return garden;
}

/** A small earned-session keepsake; local contact plane y=0. */
export function createSprout(): Group {
  const sprout = new Group();
  sprout.name = 'SessionSprout';
  const stemMaterial = new MeshStandardMaterial({ color: '#6e8264', roughness: 0.85 });
  const leafMaterial = new MeshStandardMaterial({ color: '#9fb991', roughness: 0.8 });
  const stem = new Mesh(new CylinderGeometry(0.004, 0.006, 0.07, 7), stemMaterial);
  stem.name = 'SproutStem';
  stem.position.y = 0.035;
  sprout.add(stem);
  [-1, 1].forEach((side) => {
    const leaf = new Mesh(new SphereGeometry(0.022, 10, 6), leafMaterial);
    leaf.name = side < 0 ? 'LeftSproutLeaf' : 'RightSproutLeaf';
    leaf.scale.set(1, 0.35, 0.53);
    leaf.position.set(side * 0.016, 0.06, 0);
    leaf.rotation.z = side * 0.42;
    sprout.add(leaf);
  });
  return sprout;
}
