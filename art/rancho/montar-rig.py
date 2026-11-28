"""Rig 2D do rancho e exportação da folha de poses.

blender -b -t 4 -P art/rancho/montar-rig.py -- /caminho/folha.png
"""

from math import cos, pi, radians, sin
from pathlib import Path
import json
import sys

import bpy
from mathutils import Matrix


ROOT = Path(__file__).resolve().parents[2]
INK = "#291a24"
CELL = 144
COLUMNS = 10
SPAN = 2.86
MATERIALS = {}


def rgb(hex_color):
    channels = [int(hex_color[index:index + 2], 16) / 255 for index in (1, 3, 5)]
    return [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in channels]


def material(color):
    if color not in MATERIALS:
        mat = bpy.data.materials.new(color)
        mat.diffuse_color = (*rgb(color), 1)
        MATERIALS[color] = mat
    return MATERIALS[color]


def link(scene, body, parent):
    scene.collection.objects.link(body)
    body.parent = parent
    return body


def pivot(scene, name, x=0, y=0, z=0, parent=None):
    obj = link(scene, bpy.data.objects.new(name, None), parent)
    obj.empty_display_size = .07
    obj.location = (x, y, z)
    return obj


def fill(scene, parent, name, points, color, z):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([(x, y, z) for x, y in points], [], [tuple(range(len(points)))])
    mesh.materials.append(material(color))
    return link(scene, bpy.data.objects.new(name, mesh), parent)


def stroke(scene, parent, name, points, color, z, width=.02, closed=False):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = width / 2
    curve.resolution_u = 1
    curve.bevel_resolution = 1
    curve.use_fill_caps = True
    spline = curve.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for vertex, (x, y) in zip(spline.points, points):
        vertex.co = (x, y, z, 1)
    spline.use_cyclic_u = closed
    curve.materials.append(material(color))
    return link(scene, bpy.data.objects.new(name, curve), parent)


def shape(scene, parent, name, points, color, z, width=.023):
    obj = fill(scene, parent, name, points, color, z)
    if width:
        stroke(scene, parent, name + " · traço", points, INK, z + .01, width, True)
    return obj


def oval(scene, parent, name, x, y, rx, ry, color, z, width=.021):
    points = [(x + rx * cos(i * pi / 12), y + ry * sin(i * pi / 12)) for i in range(24)]
    return shape(scene, parent, name, points, color, z, width)


def track(obj, keys):
    for frame, angle, dx, dy, sx, sy in keys:
        if frame == keys[0][0]:
            home = obj.location.copy()
        obj.rotation_euler.z = radians(angle)
        obj.location.x = home.x + dx
        obj.location.y = home.y + dy
        obj.scale = (sx, sy, 1)
        for path in ("rotation_euler", "location", "scale"):
            obj.keyframe_insert(path, frame=frame, group=obj.name)


def pose(obj, frame_angles):
    track(obj, [(f, a, 0, 0, 1, 1) for f, a in frame_angles])


def hold_visibility(objects, points):
    for obj in objects:
        for frame, visible in points:
            obj.hide_render = not visible
            obj.hide_viewport = not visible
            obj.keyframe_insert("hide_render", frame=frame)
            obj.keyframe_insert("hide_viewport", frame=frame)


def stage(name, width=1, height=1):
    scene = bpy.data.scenes.new(name)
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x = width * CELL
    scene.render.resolution_y = height * CELL
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.fps = 24
    scene.view_settings.view_transform = "Standard"
    shading = scene.display.shading
    shading.light = "FLAT"
    shading.color_type = "MATERIAL"
    shading.show_shadows = False
    shading.show_cavity = False
    shading.show_specular_highlight = False
    scene.display.render_aa = "16"
    cam = bpy.data.cameras.new(name + " · ortográfica")
    cam.type = "ORTHO"
    cam.ortho_scale = width * SPAN
    scene.camera = link(scene, bpy.data.objects.new(cam.name, cam), None)
    scene.camera.location.z = 20
    return scene


def sandal(scene, parent, name, size=1):
    root = pivot(scene, name, parent=parent)
    root.scale = (size, size, 1)
    outline = [(-.38,-.08),(-.35,.05),(-.21,.17),(.03,.23),(.25,.20),
               (.37,.09),(.38,-.03),(.25,-.14),(.02,-.20),(-.25,-.21)]
    shape(scene, root, "Sola", outline, "#246393", .04)
    shape(scene, root, "Palmilha", [(x * .94, y * .78 + .025) for x,y in outline], "#f1bd84", .065, .017)
    strap = [(-.20,-.09),(-.12,.09),(.00,.18),(.12,.16),(.25,.01),(.19,-.02),
             (.08,.085),(.005,.11),(-.07,.07),(-.15,-.105)]
    shape(scene, root, "Tira azul", strap, "#359bcf", .095, .016)
    stroke(scene, root, "Luz na tira", [(-.13,-.016),(-.07,.082),(.01,.132),(.09,.125)], "#97dbec", .12, .014)
    return root


def senhora():
    scene = stage("Senhora do rancho")
    root = pivot(scene, "Pés e apoio", 0, -.70)
    hips = pivot(scene, "Quadril", -.045, .27, parent=root)
    oval(scene, root, "Sapato esquerdo", -.20, .03, .13, .066, "#39252e", .02)
    oval(scene, root, "Sapato direito", .17, .027, .14, .067, "#39252e", .03)
    shape(scene, hips, "Saia", [(-.22,.26),(.21,.24),(.31,-.18),
          (.18,-.24),(-.12,-.24),(-.29,-.17)], "#9d4561", .08)
    for x in [-.14, .01, .17]:
        stroke(scene, hips, "Prega da saia", [(x * .67,.14),(x,-.12),(x + .01,-.21)], "#612839", .11, .017)

    shoulder = pivot(scene, "Peito e xale", -.015, .26, .15, hips)
    shape(scene, shoulder, "Xale", [(-.22,.39),(-.33,.27),(-.32,.02),(-.19,-.095),
          (.16,-.115),(.33,-.04),(.30,.25),(.21,.38)], "#463466", .04)
    shape(scene, shoulder, "Dobra violeta", [(-.245,.27),(-.27,.13),(-.13,.028),(.16,-.008),
          (.29,.05),(.24,.14),(-.03,.085),(-.15,.17)], "#766097", .055, 0)
    stroke(scene, shoulder, "Debrum", [(-.31,.053),(-.16,-.045),(.133,-.061),(.283,-.006)], "#d5a26e", .08, .019)
    oval(scene, shoulder, "Broche de cobre", .12, .14, .042, .036, "#f6bd71", .105, .014)

    head = pivot(scene, "Pescoço", 0, .36, .24, shoulder)
    oval(scene, head, "Coque", -.196, .35, .102, .098, "#c9b3a9", .02)
    oval(scene, head, "Cabelo grisalho", -.015, .255, .248, .218, "#eee0cf", .055)
    oval(scene, head, "Orelha", -.171, .197, .054, .067, "#d38a5b", .075, .014)
    shape(scene, head, "Rosto", [(-.174,.29),(-.112,.343),(.047,.367),(.156,.319),
          (.204,.253),(.229,.203),(.266,.175),(.245,.132),(.194,.108),
          (.145,.06),(.064,.052),(-.018,.062),(-.10,.103),(-.147,.168)], "#eaaa73", .098)
    shape(scene, head, "Mecha clara", [(-.191,.302),(-.153,.388),(-.017,.409),
          (.108,.375),(.160,.327),(.102,.34),(.008,.332),(-.096,.284),(-.149,.239)], "#f5e5ce", .128, .017)
    stroke(scene, head, "Vinco da mecha", [(-.145,.304),(-.04,.365),(.073,.372)], "#aa8d83", .15, .013)
    oval(scene, head, "Olho", .143,.247,.043,.027,"#fff1db",.143,.013)
    oval(scene, head, "Pupila", .161,.244,.015,.020,INK,.165,0)
    brow = pivot(scene, "Sobrancelha", .13, .29, .17, head)
    stroke(scene, brow, "Olhar atento", [(-.046,.009),(.007,-.004),(.052,-.018)], INK,.01,.025)
    stroke(scene, head, "Boca", [(.074,.102),(.127,.119),(.171,.107)], "#61353a", .15, .017)
    stroke(scene, head, "Ruga", [(-.038,.265),(-.056,.237)], "#a65f51", .145, .011)

    arm = pivot(scene, "Ombro do lançamento", .22, .26, .34, shoulder)
    oval(scene, arm, "Manga", .077,-.034,.125,.090,"#553770",.02)
    elbow = pivot(scene, "Cotovelo", .142, -.033, .063, arm)
    shape(scene, elbow, "Antebraço", [(-.018,-.072),(.115,-.042),(.229,.14),
          (.169,.185),(.078,.081),(-.029,.056)], "#eaaa73", .025)
    hand = pivot(scene, "Punho", .191, .162, .062, elbow)
    oval(scene, hand, "Mão", 0,0,.061,.065,"#f0b782",.03,.019)
    held = pivot(scene, "Chinelo preso à mão", .065, .125, .055, hand)
    held.rotation_euler.z = radians(59)
    sandal(scene, held, "Chinelo da senhora", .65)

    track(shoulder, [(1,-1,0,0,1,1),(5,2,.005,.021,1,1),(8,-1,0,0,1,1),
          (11,0,0,0,1,1),(22,12,-.08,-.06,1.04,.92),(24,-9,.073,.026,1,1.08),
          (27,-1,.035,-.025,1.02,.96),(34,0,0,0,1,1)])
    pose(arm, [(1,-13),(5,-6),(8,-13),(11,-13),(20,72),(23,87),(24,-15),(26,-37),(30,-22),(34,-13)])
    pose(elbow, [(1,5),(8,5),(11,5),(20,34),(23,20),(24,-27),(27,3),(34,5)])
    pose(head, [(1,-5),(5,-1),(8,-5),(11,-4),(21,6),(24,-12),(32,-4),(34,-4)])
    pose(brow, [(1,0),(8,0),(11,0),(20,-20),(25,-25),(34,0)])
    hold_visibility(held.children_recursive, [(1,True),(23,True),(24,False),(31,False),(32,True)])
    scene.timeline_markers.new("Solta o chinelo", frame=24)
    scene.frame_end = 34
    return scene


def armadilha():
    scene = stage("Armadilha de chinelo")
    root = pivot(scene, "Base", 0, -.62)
    for x, y, size in [(-.28,.05,.08),(-.21,-.03,.07),(.245,.04,.09),(.35,-.02,.045)]:
        shape(scene, root, "Pedra de apoio", [(x-size,y),(x-size*.49,y+size*.48),
              (x+size*.64,y+size*.53),(x+size,y-size*.12),(x+size*.38,y-size*.38)], "#a04d36", .015)
    coil = pivot(scene, "Mola", -.026, .045, .05, root)
    path = [(.083*cos(i*pi/7), .59*i/56+.023*sin(i*pi/7)) for i in range(57)]
    stroke(scene, coil, "Contorno da mola", path, INK, .05, .075)
    stroke(scene, coil, "Aço quente", path, "#a57556", .093, .043)
    lever = pivot(scene, "Chinelo da mola", .021, .69, .23, root)
    sandal(scene, lever, "Sola da armadilha", 1.0)
    bait = pivot(scene, "Haste e isca", -.20, .67, .26, root)
    stroke(scene, bait, "Haste", [(0,0),(-.07,.21),(-.27,.27),(-.33,.22)], INK, .02, .039)
    drop = pivot(scene, "Isca vermelha", -.33, .22, .05, bait)
    shape(scene, drop, "Gota", [(0,.029),(-.026,-.054),(-.075,-.114),(-.055,-.193),
          (.01,-.224),(.067,-.197),(.079,-.126),(.034,-.055)], "#e42838", .04)
    stroke(scene, drop, "Brilho da isca", [(-.028,-.081),(-.042,-.117),(-.042,-.143)], "#ffb49c", .07,.017)
    pose(drop, [(1,-8),(4,9),(6,-8),(9,3),(14,-14),(15,30),(18,-27),(22,0)])
    track(coil, [(1,0,0,0,1,1),(6,0,0,0,1,1),(9,0,0,0,1,1),
          (14,12,0,0,1,.56),(15,-22,0,0,.86,1.26),(17,-13,0,0,1,1.07),(22,0,0,0,1,1)])
    track(lever, [(1,19,0,0,1,1),(6,19,0,0,1,1),(9,19,0,0,1,1),
          (14,36,-.12,-.235,1,1),(15,-29,.17,.124,1.13,.96),(17,-14,.13,.083,1,1),(22,19,0,0,1,1)])
    track(bait, [(1,0,0,0,1,1),(9,0,0,0,1,1),(14,14,-.08,-.18,1,1),
          (15,-21,.15,.09,1,1),(18,13,0,.03,1,1),(22,0,0,0,1,1)])
    scene.timeline_markers.new("Golpe da armadilha", frame=15)
    scene.frame_end = 22
    return scene


def jogador():
    scene = stage("Trypanosoma · personagem")
    root = pivot(scene, "Apoio do personagem", 0, -.12)
    body = pivot(scene, "Corpo curvo", 0,.02, .08, root)
    tail = pivot(scene, "Onda da cauda", -.36,-.05,.01,body)
    tip = pivot(scene, "Ponta do flagelo", -.37,.14,.02,tail)
    wave = [(0,0),(-.12,.008),(-.274,.05),(-.37,.14)]
    stroke(scene, tail, "Flagelo", wave, INK,.01,.09)
    stroke(scene, tail, "Luz do flagelo", wave, "#b8ec81",.07,.046)
    reach = [(0,0),(-.07,.107),(-.163,.146),(-.26,.104)]
    stroke(scene, tip, "Ponta", reach, INK,.02,.069)
    stroke(scene, tip, "Luz da ponta", reach, "#b8ec81",.07,.033)
    shell = [(-.59,-.067),(-.34,-.159),(-.088,-.269),(.195,-.23),(.436,-.08),
             (.547,.127),(.5,.272),(.354,.37),(.129,.393),(-.034,.301),(.091,.286),
             (.251,.238),(.279,.122),(.177,.044),(.008,-.009),(-.217,-.019),(-.414,-.045)]
    shape(scene, body, "Silhueta em meia-lua", shell, "#469b78", .16,.039)
    shape(scene, body, "Faixa de contorno", [(-.40,-.10),(-.14,-.17),(.13,-.157),(.344,-.047),
          (.438,.12),(.403,.234),(.503,.173),(.438,-.02),(.218,-.203),(-.091,-.222)], "#28605f",.19,0)
    stroke(scene, body, "Reflexo da película", [(-.277,-.061),(-.085,-.083),(.106,-.066),
          (.255,.013),(.335,.139)], "#addeb3",.22,.037)
    oval(scene, body, "Núcleo visível", .13,-.095,.112,.068,"#a0cc9a",.235,.018)
    oval(scene, body, "Cinetoplasto de referência", -.145,-.135,.035,.034,"#e4cb69",.245,.014)
    face = pivot(scene, "Expressão", .42,.14,.27,body)
    oval(scene, face, "Olho", 0,.03,.058,.064,"#fff4ce",.055,.020)
    oval(scene, face, "Pupila", .024,.022,.022,.032,INK,.081,0)
    stroke(scene, face, "Sobrancelha", [(-.059,.113),(.008,.113),(.062,.087)], INK,.075,.028)
    stroke(scene, face, "Boca", [(-.002,-.058),(.049,-.049)], INK,.065,.018)

    track(root, [(1,0,0,0,1,1),(4,3,0,.045,.97,1.04),(8,0,0,0,1,1),
          (11,-3,0,.01,1,1),(14,5,.049,.067,1.06,.97),(18,-3,0,.01,1,1),
          (21,-13,.089,-.02,1.21,.80),(24,-8,.15,.017,1.24,.84),(26,0,.01,0,1,1),
          (29,12,-.14,.03,.84,1.16),(31,-8,-.072,.018,1.09,.9),(33,0,0,0,1,1),
          (36,-4,-.03,0,1,1),(39,12,-.127,0,.87,1.15),(40,-8,.108,.02,1.16,.86),
          (43,0,0,0,1,1)])
    pose(tail, [(1,-1),(4,13),(8,-1),(11,-11),(14,22),(18,-11),(21,-14),(26,0),
          (29,22),(33,0),(36,-6),(39,25),(40,-18),(43,-1)])
    pose(tip, [(1,8),(4,-17),(8,8),(11,18),(14,-19),(18,18),(21,5),(26,0),
          (29,-21),(33,0),(36,10),(39,-20),(40,10),(43,6)])
    scene.timeline_markers.new("Solta o pulso",frame=40)
    scene.frame_end = 43
    return scene


def projectiles():
    scene = stage("Chinelo em voo")
    sandal(scene, None, "Chinelo solto", 1.36)
    return scene


def export_atlas(output, tracks):
    total = sum(end - start + 1 for _,_,start,end,_,_ in tracks)
    rows = (total+COLUMNS-1)//COLUMNS
    atlas = stage("Exportação", COLUMNS, rows)
    index = 0
    metadata = {}
    for name, source, first, last, fps, event in tracks:
        bpy.context.window.scene = source
        metadata[name] = {"first":index, "count":last-first+1, "fps":fps}
        if event is not None:
            metadata[name]["event"] = event-first
        for frame in range(first,last+1):
            source.frame_set(frame)
            bpy.context.view_layer.update()
            dx = (index % COLUMNS - (COLUMNS-1)/2) * SPAN
            dy = ((rows-1)/2 - index // COLUMNS) * SPAN
            offset = Matrix.Translation((dx,dy,0))
            for obj in source.objects:
                if obj.type not in {"MESH","CURVE"} or obj.hide_render:
                    continue
                clone = obj.copy()
                clone.animation_data_clear()
                clone.parent = None
                clone.matrix_world = offset @ obj.matrix_world
                atlas.collection.objects.link(clone)
            index += 1
    bpy.context.window.scene = atlas
    atlas.render.filepath = str(output)
    bpy.ops.render.render(write_still=True)
    manifest = json.dumps(metadata, ensure_ascii=False, indent=2)
    (ROOT/"dist/rancho-quadros.js").write_text(
        "// Gerado pelo rig 2D do rancho.\n"
        f"export const CELL = {CELL}, COLUMNS = {COLUMNS};\nexport const CLIPS = {manifest};\n",
        encoding="utf-8",
    )


def main():
    output = Path(sys.argv[sys.argv.index("--")+1]).resolve()
    initial = bpy.context.scene
    lady, trap, player, flying = senhora(), armadilha(), jogador(), projectiles()
    bpy.context.window.scene = lady
    bpy.data.scenes.remove(initial)
    for scene in (lady,trap,player,flying):
        scene.frame_set(1)
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/"art/rancho/rancho-animacoes.blend"), compress=True)
    export_atlas(output, [
        ("playerIdle",player,1,8,12,None),
        ("playerMove",player,11,18,20,None),
        ("playerDash",player,21,26,30,None),
        ("playerHit",player,29,33,24,None),
        ("playerAttack",player,36,43,24,40),
        ("ladyIdle",lady,1,8,12,None),
        ("ladyAttack",lady,11,34,24,24),
        ("trapIdle",trap,1,6,12,None),
        ("trapHit",trap,9,22,24,15),
        ("sandal",flying,1,1,1,None),
    ])


if __name__ == "__main__":
    main()
