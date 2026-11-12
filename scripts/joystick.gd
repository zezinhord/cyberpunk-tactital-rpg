extends Control
class_name TenebriaJoystick

var vector: Vector2 = Vector2.ZERO
var touch_index: int = -1
var finger_position: Vector2 = Vector2.ZERO
const RADIUS: float = 65.0

func _ready() -> void:
    mouse_filter = Control.MOUSE_FILTER_STOP
    set_process_input(true)

func _gui_input(event: InputEvent) -> void:
    if event is InputEventScreenTouch:
        if event.pressed and touch_index == -1:
            touch_index = event.index
            finger_position = event.position
            _update_axis(event.position)
            accept_event()
        elif not event.pressed and event.index == touch_index:
            touch_index = -1
            vector = Vector2.ZERO
            queue_redraw()
            accept_event()
    elif event is InputEventScreenDrag and event.index == touch_index:
        finger_position = event.position
        _update_axis(event.position)
        accept_event()
    elif event is InputEventMouseButton:
        if event.button_index == MOUSE_BUTTON_LEFT:
            if event.pressed:
                touch_index = 999
                _update_axis(event.position)
            elif touch_index == 999:
                touch_index = -1
                vector = Vector2.ZERO
                queue_redraw()
            accept_event()
    elif event is InputEventMouseMotion and touch_index == 999:
        _update_axis(event.position)
        accept_event()

func _update_axis(pos: Vector2) -> void:
    var center = size * 0.5
    vector = (pos - center) / RADIUS
    if vector.length() > 1.0:
        vector = vector.normalized()
    queue_redraw()

func _draw() -> void:
    var center = size * 0.5
    draw_circle(center,77,Color(0.09,0.11,0.16,0.46))
    draw_arc(center,75,0,TAU,48,Color(0.72,0.62,0.48,0.6),3.0)
    draw_circle(center + vector * RADIUS,34,Color(0.74,0.57,0.43,0.69))
    draw_arc(center + vector * RADIUS,34,0,TAU,36,Color(1,0.83,0.64,0.8),2.0)
