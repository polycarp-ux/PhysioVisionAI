import numpy as np

def calculate_angle(a, b, c):
    """
    Calculates the 2D geometric angle between three joints.
    Arguments:
        a: Landmark 1 coordinate [x, y] (e.g., Shoulder)
        b: Landmark 2 coordinate [x, y] (e.g., Elbow - the hinge vertex)
        c: Landmark 3 coordinate [x, y] (e.g., Wrist)
    Returns:
        angle: Calculated angle in degrees (0 to 180)
    """
    a = np.array(a) # First point
    b = np.array(b) # Vertex point
    c = np.array(c) # End point
    
    # Calculate radians using arc-tangent
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    
    # Ensure the angle stays within a standard 180 degree hinge movement limit
    if angle > 180.0:
        angle = 360 - angle
        
    return int(angle)